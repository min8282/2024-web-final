const passport = require('passport');
const localStrategy = require('./localStrategy');
const kakaoStrategy = require('./kakaoStrategy');
const User = require('../models/user');

module.exports = () => {
  passport.serializeUser((user, done) => {
    console.info('___passport.serializeUser()');
    done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    console.info('___passport.deserializeUser()');
    User.findOne({ where: { id } })
      .then((user) => done(null, user))
      .catch((err) => done(err));
  });

  passport.use('local', localStrategy);
  passport.use('kakao', kakaoStrategy);
};
