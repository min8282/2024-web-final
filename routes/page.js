const express = require('express');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { Post, User, Hashtag } = require('../models');

const router = express.Router();

// req.user의 사용자 데이터를 넌적스 템플릿에서 이용가능하도록 res.locals에 저장
router.use((req, res, next) => {
  res.locals.user = req.user;
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

// 마이페이지 이동 라우터
router.get('/mypage', isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.user.id } });
    const posts = await Post.findAll({
      where: { UserId: user.id },
    });
    res.render('mypage', { title: '마이페이지', user, posts });
  } catch (error) {
    console.error(error);
    next(error);
  }
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
