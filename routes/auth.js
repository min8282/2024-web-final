const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const User = require('../models/user');
const Post = require('../models/post');

const router = express.Router();

// 회원가입 페이지 라우터
router.get('/join', isNotLoggedIn, (req, res) => {
  res.render('join', { title: '회원가입' });
});

// 로그인 페이지 라우터
router.get('/login', isNotLoggedIn, (req, res) => {
  res.render('login', { title: '로그인' });
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
      return res.redirect(`/?loginError=${info.message}`);
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

module.exports = router;
