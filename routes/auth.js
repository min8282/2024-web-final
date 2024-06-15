const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const User = require('../models/user');
const Post = require('../models/post');

const router = express.Router();

// 노드메일러 설정
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL, // 자신의 Gmail 주소
    pass: process.env.APP_PASSWORD, // 앱 비밀번호
  },
});

// 회원가입 페이지 라우터
router.get('/join', isNotLoggedIn, (req, res) => {
  res.render('join', { title: '회원가입' });
});

// 로그인 페이지 라우터
router.get('/login', isNotLoggedIn, (req, res) => {
  const { loginError } = req.query;
  res.render('login', { title: '로그인', loginError });
});

// 회원가입 처리
router.post('/join', isNotLoggedIn, async (req, res, next) => {
  const { email, nick, password, contact } = req.body;
  try {
    const exUser = await User.findOne({ where: { email } });
    if (exUser) {
      return res.redirect('/join?error=exist');
    }
    const hash = await bcrypt.hash(password, 12);
    await User.create({
      email,
      nick,
      password: hash,
      contact,
    });
    return res.redirect('/');
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

// 로그인 처리
router.post('/login', isNotLoggedIn, (req, res, next) => {
  passport.authenticate('local', (authError, user, info) => {
    if (authError) {
      console.error(authError);
      return next(authError);
    }
    if (!user) {
      return res.redirect(`/auth/login?loginError=${info.message}`);
    }
    return req.login(user, (loginError) => {
      if (loginError) {
        console.error(loginError);
        return next(loginError);
      }
      return res.redirect('/');
    });
  })(req, res, next);
});

// 로그아웃 처리
router.get('/logout', isLoggedIn, (req, res) => {
  req.logout(() => {
    req.session.destroy();
    res.redirect('/');
  });
});

// 사용자 정보 수정 페이지 라우터
router.get('/edit', isLoggedIn, (req, res) => {
  res.render('edit_profile', { title: '내 정보 수정' });
});

// 사용자 정보 수정 처리
router.post('/edit', isLoggedIn, async (req, res, next) => {
  const { nick, contact } = req.body;
  try {
    await User.update({ nick, contact }, { where: { id: req.user.id } });
    res.redirect('/mypage');
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 사용자 탈퇴 처리
router.post('/delete', isLoggedIn, async (req, res, next) => {
  try {
    await Post.destroy({ where: { UserId: req.user.id } }); // 사용자의 모든 게시글 삭제
    await User.destroy({ where: { id: req.user.id } }); // 사용자 삭제
    req.logout(() => {
      req.session.destroy();
      res.redirect('/');
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 비밀번호 찾기 페이지 라우터
router.get('/forgot-password', isNotLoggedIn, (req, res) => {
  res.render('forgot_password', { title: '비밀번호 찾기' });
});

// 비밀번호 찾기 처리 라우터
router.post('/forgot-password', isNotLoggedIn, async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).send('해당 이메일로 등록된 사용자가 없습니다.');
    }

    // 임의의 번호 생성
    const tempPassword = crypto.randomBytes(4).toString('hex');

    // 이메일 발송
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: 'NodeBird 임시 비밀번호',
      text: `임시 비밀번호는 ${tempPassword} 입니다.`,
    };

    await transporter.sendMail(mailOptions);

    // 임시 비밀번호 저장 (암호화)
    const hashedPassword = await bcrypt.hash(tempPassword, 12);
    await User.update({ password: hashedPassword }, { where: { id: user.id } });

    res.send('임시 비밀번호가 이메일로 전송되었습니다.');
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 카카오 로그인 라우터
router.get('/kakao', passport.authenticate('kakao'));

// 카카오 로그인 콜백 라우터
router.get('/kakao/callback', passport.authenticate('kakao', {
  failureRedirect: '/login',
}), (req, res) => {
  res.redirect('/');
});

module.exports = router;
