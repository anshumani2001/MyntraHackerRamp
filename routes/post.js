const express = require('express');
const app = express();
const mongoose = require('mongoose');
const router = express.Router();
const Post = require('../models/post');
const Comment = require('../models/comment');
const User = require('../models/user');
const { isLoggedIn } = require('../middleware');
const multer = require('multer');
const { cloudinary, storage } = require('../cloudinary');
const upload = multer({ storage })

router.get('/', async (req, res) => {
    const posts = await Post.find({}).populate('author');
    const users = await User.find({});
    let visiblePosts = [];
    for (let post of posts) {
        if (req.user && post.author.username == req.user.username && post.author) {
            visiblePosts.push(post);
        }
        else if (post.isPrivate && post.isPrivate == 'Private') {
            // console.log(post.isPrivate, req.user)
            if (req.user && post.author.followers.includes(req.user._id)) {
                visiblePosts.push(post);
            }
        } else {
            visiblePosts.push(post);
        }
    }
    res.render('posts/index', { posts: visiblePosts, users });
});

router.get('/new', isLoggedIn, (req, res) => {
    res.render('posts/new')
})

router.post('/', upload.array('image'), async (req, res) => {  //Post Req
    const { description, isPrivate } = req.body;
    console.log(req.body, req.files);
    // console.log(description, images)
    const newPost = new Post({ description, isPrivate });
    newPost.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    newPost.author = req.user._id;
    await newPost.save();
    console.log(newPost)
    req.flash('success', 'Posted the post');
    res.redirect('/posts')
    // res.send(req.body);
    // res.send('Post request after creating a <post>');
})

router.get('/:id', async (req, res,) => {
    const post = await Post.findById(req.params.id).populate({
        path: 'comments',
        populate: {
            path: 'author'
        }
    }).populate('author');
    res.render('posts/show', { post });
});

router.get('/:id/edit', isLoggedIn, async (req, res) => {
    const post = await Post.findById(req.params.id);
    res.render('posts/edit', { post });
})

router.put('/:id', upload.array('image'), async (req, res) => { //EDIT
    const { id } = req.params;
    // console.log(req.body);
    const post = await Post.findByIdAndUpdate(id, { ...req.body.post });
    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
    post.images.push(...imgs);
    await post.save();
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await post.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } })
    }
    req.flash('success', "Post Edited")
    res.redirect('/posts/' + post._id);

})
//let counter=1;
router.get('/:id/like', isLoggedIn, async (req, res) => {
    const user = req.user;

    const { id } = req.params;
    const post = await Post.findById(id);
    post.likesCount += 1;
    //counter*=-1;

    await post.save();
    res.redirect('/posts/' + id);
    // console.log(post.likesCount);
})
//app.post('/posts/:id/like',)

router.post('/:id/comments', async (req, res) => {
    //res.send('works');
    const post = await Post.findById(req.params.id);
    // console.log(req.body);
    const comm = new Comment(req.body.comment);
    comm.author = req.user._id;
    post.comments.push(comm);
    await comm.save()
    await post.save();
    req.flash('success', 'Comment Added')
    res.redirect('/posts/' + post.id);
})

router.delete('/:id/comments/:commentid', async (req, res) => {
    const { id, commentid } = req.params;
    await Post.findByIdAndUpdate(id, { $pull: { comments: commentid } });
    await Comment.findByIdAndDelete(req.params.commentid);
    req.flash('success', "Comment Deleted");
    res.redirect('/posts/' + id);
})

router.delete('/:id', async (req, res) => { //DELETE
    const { id } = req.params;
    await Post.findByIdAndDelete(id);
    req.flash('success', 'Post was deleted');
    res.redirect('/posts');
})

module.exports = router;