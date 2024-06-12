const KakaoStrategy = require('passport-kakao').Strategy;
const User = require('../models/user');

module.exports = new KakaoStrategy(
  {
    clientID: process.env.KAKAO_ID,
    callbackURL: '/auth/kakao/callback',
  },
  async (accessToken, refreshToken, profile, done) => {
    console.info('___new KakaoStrategy()');
    console.log('___kakao profile', profile);
    try {
      const exUser = await User.findOne({
        where: { snsId: profile.id, provider: 'kakao' },
      });
      if (exUser) {
        console.log('___kakao exUser', exUser);
        done(null, exUser);
      } else {
        const newUser = await User.create({
          email: profile._json && profile._json.kakao_account.email,
          nick: profile.displayName,
          snsId: profile.id,
          provider: 'kakao',
        });
        console.log('___kakao newUser', newUser);
        done(null, newUser);
      }
    } catch (error) {
      console.error(error);
      done(error);
    }
  }
);
