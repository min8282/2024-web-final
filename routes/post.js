const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const Post = require('../models/post');
const User = require('../models/user');
const Like = require('../models/like');
const { isLoggedIn } = require('./middlewares');

const router = express.Router();

// 업로드 디렉토리가 없으면 생성
try {
  fs.readdirSync('uploads');
} catch (error) {
  console.error('uploads 폴더가 없어 생성합니다.');
  fs.mkdirSync('uploads');
}

// multer 설정
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    // 임시 파일명 설정, 실제 파일명은 게시글 생성 후 설정됨
    cb(null, uuidv4() + path.extname(file.originalname));
  },
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024, files: 15 } });

// 방 내놓기 페이지
router.get('/new', isLoggedIn, (req, res) => {
  res.render('post', { title: '방 내놓기' });
});

// 방 등록 처리
router.post('/', isLoggedIn, upload.array('images', 15), async (req, res, next) => {
  try {
    const post = await Post.create({
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
      location: req.body.location,
      UserId: req.user.id,
    });

    // 파일명 설정 (userid-이미지 순서)
    const imageUrls = req.files.map((file, index) => {
      const newFilename = `${post.id}-${index + 1}${path.extname(file.originalname)}`;
      fs.renameSync(file.path, path.join(file.destination, newFilename));
      return `/uploads/${newFilename}`;
    });

    await post.update({ imageUrl: JSON.stringify(imageUrls) });

    console.log('Post:', post.title, post.UserId);
    res.redirect('/');
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// // 게시글 상세 페이지
// router.get('/:id', async (req, res, next) => {
//   try {
//     const post = await Post.findOne({
//       where: { id: req.params.id },
//       include: {
//         model: User,
//         attributes: ['id', 'nick', 'email'],
//       },
//     });

//     if (!post) {
//       return res.status(404).send('게시글이 없습니다.');
//     }

//     const liked = req.user ? await Like.findOne({
//       where: {
//         UserId: req.user.id,
//         PostId: req.params.id,
//       },
//     }) : null;

//     res.render('post_detail', {
//       title: post.title,
//       post,
//       imageUrls: JSON.parse(post.imageUrl),
//       liked: !!liked,
//     });
//   } catch (error) {
//     console.error(error);
//     next(error);
//   }
// });
// 게시글 상세 페이지
router.get('/:id', async (req, res, next) => {
  try {
    const post = await Post.findOne({
      where: { id: req.params.id },
      include: {
        model: User,
        attributes: ['id', 'nick', 'contact'], // contact 속성 추가
      },
    });

    if (!post) {
      return res.status(404).send('게시글이 없습니다.');
    }

    const liked = await Like.findOne({
      where: {
        UserId: req.user ? req.user.id : null,
        PostId: req.params.id,
      },
    });

    res.render('post_detail', {
      title: post.title,
      post,
      imageUrls: JSON.parse(post.imageUrl),
      liked: !!liked,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});


// 게시글 수정 페이지
router.get('/:id/edit', isLoggedIn, async (req, res, next) => {
  try {
    const post = await Post.findOne({ where: { id: req.params.id } });

    if (!post) {
      return res.status(404).send('게시글이 없습니다.');
    }

    if (post.UserId !== req.user.id) {
      return res.status(403).send('권한이 없습니다.');
    }

    res.render('edit_post', {
      title: '게시글 수정',
      post,
      imageUrls: JSON.parse(post.imageUrl),
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 게시글 수정 처리
router.post('/:id/edit', isLoggedIn, upload.array('images', 15), async (req, res, next) => {
  try {
    const post = await Post.findOne({ where: { id: req.params.id } });

    if (!post) {
      return res.status(404).send('게시글이 없습니다.');
    }

    if (post.UserId !== req.user.id) {
      return res.status(403).send('권한이 없습니다.');
    }

    const updatedData = {
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
      location: req.body.location,
    };

    if (req.files.length > 0) {
      const imageUrls = req.files.map((file, index) => {
        const newFilename = `${post.id}-${index + 1}${path.extname(file.originalname)}`;
        fs.renameSync(file.path, path.join(file.destination, newFilename));
        return `/uploads/${newFilename}`;
      });

      updatedData.imageUrl = JSON.stringify(imageUrls);
    }

    await Post.update(updatedData, { where: { id: req.params.id } });

    res.redirect(`/post/${req.params.id}`);
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 게시글 삭제
router.post('/:id/delete', isLoggedIn, async (req, res, next) => {
  try {
    const post = await Post.findOne({ where: { id: req.params.id } });

    if (!post) {
      return res.status(404).send('게시글이 없습니다.');
    }

    if (post.UserId !== req.user.id) {
      return res.status(403).send('권한이 없습니다.');
    }

    await Post.destroy({ where: { id: req.params.id } });

    res.redirect('/');
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 좋아요 처리
router.post('/:postId/like', isLoggedIn, async (req, res, next) => {
  try {
    const post = await Post.findOne({ where: { id: req.params.postId } });
    if (!post) {
      return res.status(404).send('게시글이 존재하지 않습니다.');
    }

    const [like, created] = await Like.findOrCreate({
      where: {
        UserId: req.user.id,
        PostId: req.params.postId,
      },
    });

    if (!created) {
      return res.status(400).send('이미 좋아요를 눌렀습니다.');
    }

    res.send('success');
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// 좋아요 취소 처리
router.delete('/:postId/unlike', isLoggedIn, async (req, res, next) => {
  try {
    const post = await Post.findOne({ where: { id: req.params.postId } });
    if (!post) {
      return res.status(404).send('게시글이 존재하지 않습니다.');
    }

    const like = await Like.findOne({
      where: {
        UserId: req.user.id,
        PostId: req.params.postId,
      },
    });

    if (!like) {
      return res.status(400).send('좋아요를 누르지 않았습니다.');
    }

    await Like.destroy({
      where: {
        UserId: req.user.id,
        PostId: req.params.postId,
      },
    });

    res.send('success');
  } catch (error) {
    console.error(error);
    next(error);
  }
});

module.exports = router;
