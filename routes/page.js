const express = require('express');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const { Post, User, Like } = require('../models');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const router = express.Router();

// req.user의 사용자 데이터를 넌적스 템플릿에서 이용가능하도록 res.locals에 저장
router.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

// // 프로필 페이지 라우터
// router.get('/profile', isLoggedIn, (req, res) => {
//   res.render('profile', { title: '내 정보 - NodeBird' });
// });

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

    // 각 게시글의 좋아요 상태를 확인하여 템플릿으로 전달
    const postsWithLikes = await Promise.all(posts.map(async post => {
      const liked = req.user ? await Like.findOne({ where: { UserId: req.user.id, PostId: post.id } }) : null;
      return {
        ...post.get({ plain: true }),
        imageUrl: post.imageUrl ? JSON.parse(post.imageUrl) : [],
        liked: !!liked,
      };
    }));

    res.render('main', {
      title: 'NodeBird',
      posts: postsWithLikes,
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// 검색 기능
router.get('/search', async (req, res, next) => {
  const query = req.query.query;

  if (!query) {
    return res.redirect('/');
  }

  try {
    const posts = await Post.findAll({
      where: {
        [Op.or]: [
          { title: { [Op.like]: `%${query}%` } },
          { location: { [Op.like]: `%${query}%` } }
        ]
      },
      include: {
        model: User,
        attributes: ['id', 'nick'],
      },
      order: [['createdAt', 'DESC']],
    });

    // 각 게시글의 좋아요 상태를 확인하여 템플릿으로 전달
    const postsWithLikes = await Promise.all(posts.map(async post => {
      const liked = req.user ? await Like.findOne({ where: { UserId: req.user.id, PostId: post.id } }) : null;
      return {
        ...post.get({ plain: true }),
        imageUrl: post.imageUrl ? JSON.parse(post.imageUrl) : [],
        liked: !!liked,
      };
    }));

    res.render('main', {
      title: '검색 결과 - NodeBird',
      posts: postsWithLikes,
      query,
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// 마이페이지 이동 라우터
router.get('/mypage', isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.user.id } });
    const posts = await Post.findAll({
      where: { UserId: user.id },
    });

    // 각 게시글의 좋아요 상태를 확인하여 템플릿으로 전달
    const postsWithLikes = await Promise.all(posts.map(async post => {
      const liked = req.user ? await Like.findOne({ where: { UserId: req.user.id, PostId: post.id } }) : null;
      return {
        ...post.get({ plain: true }),
        imageUrl: post.imageUrl ? JSON.parse(post.imageUrl) : [],
        liked: !!liked,
      };
    }));

    res.render('mypage', { title: '마이페이지', user, posts: postsWithLikes });
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

// 사용자 연락처 정보 라우터
router.get('/users/:userId/contact', isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { id: req.params.userId } });
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }
    res.json({ nick: user.nick, contact: user.contact });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 관심 목록 페이지
router.get('/favorites', isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findOne({
      where: { id: req.user.id },
      include: [{
        model: Post,
        as: 'LikedPosts',
      }],
    });

    // 각 게시글의 이미지 URL을 파싱하고 좋아요 상태를 확인하여 템플릿으로 전달
    const postsWithLikes = await Promise.all(user.LikedPosts.map(async post => {
      const liked = req.user ? await Like.findOne({ where: { UserId: req.user.id, PostId: post.id } }) : null;
      return {
        ...post.get({ plain: true }),
        imageUrl: post.imageUrl ? JSON.parse(post.imageUrl) : [],
        liked: !!liked,
      };
    }));

    res.render('favorites', {
      title: '관심목록',
      posts: postsWithLikes,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
