const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const User = require('../models/user');

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
  const { email, nick, password, contact } = req.body; // contact 추가
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
      contact, // contact 저장
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

module.exports = router;
