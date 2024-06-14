const express = require('express');
const { isLoggedIn } = require('./middlewares');
const { Like, Post } = require('../models');

const router = express.Router();

router.post('/:postId/like', isLoggedIn, async (req, res, next) => {
  try {
    const post = await Post.findOne({ where: { id: req.params.postId } });
    if (!post) {
      return res.status(404).send('게시글이 존재하지 않습니다.');
    }

    await Like.create({
      UserId: req.user.id,
      PostId: req.params.postId,
    });

    res.send('success');
  } catch (error) {
    console.error(error);
    next(error);
  }
});

router.delete('/:postId/unlike', isLoggedIn, async (req, res, next) => {
  try {
    const post = await Post.findOne({ where: { id: req.params.postId } });
    if (!post) {
      return res.status(404).send('게시글이 존재하지 않습니다.');
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
