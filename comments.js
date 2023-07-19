// Create web server for comment
const express = require('express');
const router = express.Router();
const Comment = require('../models/comment');
const Post = require('../models/post');
const User = require('../models/user');
const Like = require('../models/like');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');

// @route   POST api/comments/:post_id
// @desc    Create comment
// @access  Private
router.post(
  '/:post_id',
  auth,
  [
    check('text', 'Text is required').not().isEmpty(),
    check('text', 'Text must be less than 200 characters').isLength({
      max: 200,
    }),
  ],
  async (req, res) => {
    // Check validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ msg: errors.array()[0].msg });
    }
    try {
      // Get post
      const post = await Post.findById(req.params.post_id);
      // Check if post exists
      if (!post) {
        return res.status(404).json({ msg: 'Post not found' });
      }
      // Create comment
      const comment = new Comment({
        user: req.user.id,
        post: post.id,
        text: req.body.text,
      });
      await comment.save();
      // Add comment to post
      post.comments.unshift(comment.id);
      await post.save();
      // Get user
      const user = await User.findById(req.user.id);
      // Add comment to user
      user.comments.unshift(comment.id);
      await user.save();
      // Return comment
      res.json(comment);
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  }
);

// @route   GET api/comments/:post_id
// @desc    Get comments by post id
// @access  Private
router.get('/:post_id', auth, async (req, res) => {
  try {
    // Get comments
    const comments = await Comment.find({ post: req.params.post_id });
    // Check if comments exist
    if (!comments) {
      return res.status(404).json({ msg: 'Comments not found' });
    }
    // Return comments
    res.json(comments);
  } catch (err) {
    console.error(err);