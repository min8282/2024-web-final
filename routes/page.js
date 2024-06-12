// const express = require('express');
// const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
// const { Post, User } = require('../models');

// const router = express.Router();

// router.use((req, res, next) => {
//   // Ensure req.user is defined before accessing its properties
//   res.locals.user = req.user;
//   res.locals.followerCount = req.user && req.user.Followers ? req.user.Followers.length : 0;
//   res.locals.followingCount = req.user && req.user.Followings ? req.user.Followings.length : 0;
//   res.locals.followerIdList = req.user && req.user.Followings ? req.user.Followings.map(f => f.id) : [];
//   next();
// });

// router.get('/profile', isLoggedIn, (req, res) => {
//   res.render('profile', { title: '내 정보 - NodeBird' });
// });

// router.get('/join', isNotLoggedIn, (req, res) => {
//   res.render('join', { title: '회원가입 - NodeBird' });
// });

// router.get('/', async (req, res, next) => {
//   try {
//     const posts = await Post.findAll({
//       include: {
//         model: User,
//         attributes: ['id', 'nick'],
//       },
//       order: [['createdAt', 'DESC']],
//     });

//     // 이미지 URL을 파싱하여 템플릿으로 전달
//     const postsWithParsedImages = posts.map(post => {
//       return {
//         ...post.get({ plain: true }),
//         imageUrl: post.imageUrl ? JSON.parse(post.imageUrl) : [],
//       };
//     });

//     res.render('main', {
//       title: 'NodeBird',
//       twits: [],
//       user: req.user,
//       posts: postsWithParsedImages,
//     });
//   } catch (error) {
//     console.error(error);
//     next(error);
//   }
// });

// module.exports = router;


const express = require('express');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { Post, User } = require('../models');

const router = express.Router();

// req.user의 사용자 데이터를 넌적스 템플릿에서 이용가능하도록 res.locals에 저장
router.use((req, res, next) => {
  res.locals.user = req.user;
  // 추가: 팔로워, 팔로잉 수 및 팔로잉 ID 목록을 저장
  res.locals.followerCount = req.user?.Followers?.length || 0;
  res.locals.followingCount = req.user?.Followings?.length || 0;
  res.locals.followingIdList = req.user?.Followings?.map((f) => f.id) || [];
  next();
});

// 프로필 페이지 라우터
router.get('/profile', isLoggedIn, (req, res) => {
  res.render('profile', { title: '내 정보 - NodeBird' });
});

// 회원가입 페이지 라우터
router.get('/join', isNotLoggedIn, (req, res) => {
  res.render('join', { title: '회원가입 - NodeBird' });
});

// 메인 페이지 라우터
router.get('/', async (req, res, next) => {
  try {
    const posts = await Post.findAll({
      include: {
        model: User,
        attributes: ['id', 'nick'],
      },
      order: [['createdAt', 'DESC']],
    });

    // 이미지 URL을 파싱하여 템플릿으로 전달
    const postsWithParsedImages = posts.map(post => {
      return {
        ...post.get({ plain: true }),
        imageUrl: post.imageUrl ? JSON.parse(post.imageUrl) : [],
      };
    });

    res.render('main', {
      title: 'NodeBird',
      posts: postsWithParsedImages,
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// 추가: 해시태그 검색 결과 라우터
router.get('/hashtag', async (req, res, next) => {
  const query = req.query.hashtag;
  if (!query) {
    return res.redirect('/');
  }
  try {
    const hashtag = await Hashtag.findOne({ where: { title: query } });
    let posts = [];
    if (hashtag) {
      posts = await hashtag.getPosts({ include: [{ model: User }] });
    }

    // 이미지 URL을 파싱하여 템플릿으로 전달
    const postsWithParsedImages = posts.map(post => {
      return {
        ...post.get({ plain: true }),
        imageUrl: post.imageUrl ? JSON.parse(post.imageUrl) : [],
      };
    });

    return res.render('main', {
      title: `${query} | NodeBird`,
      posts: postsWithParsedImages,
    });
  } catch (error) {
    console.error(error);
    return next(error);
  }
});

module.exports = router;

///