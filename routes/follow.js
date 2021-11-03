const express=require('express');
const app=express();
const mongoose=require('mongoose');
const router=express.Router();
const Product=require('../models/product');
const User=require('../models/user');
const Post=require('../models/post');
const {isLoggedIn}=require('../middleware');
const multer=require('multer');
const {cloudinary,storage}=require('../cloudinary');
const upload=multer({storage})
router.get('/:userName', async (req, res) => {
    var userF = await User.findOne({ username: req.params.userName }).exec();
    if (userF) {
        // console.log(userF)
        let visiblePosts = [];
        const posts = await Post.find({}).populate('author');
        for (let post of posts) {
            // console.log(post.author)
            if (post.author && post.author.username == req.params.userName) {
                if (req.user && post.author.username == req.user.username && post.author && req.user) {
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
        }
        // console.log(userPosts)

        res.render('Users/profile', { userF, userPosts: visiblePosts })
    } else {
        res.send("No such User Exists");
    }
})
router.post('/:userName/follow', isLoggedIn, async (req, res) => {
    const toFollowUsername = req.params.userName;
    const toFollow = await User.findOne({ username: toFollowUsername }).exec();
    const currUser = await User.findOne({ username: req.user.username }).populate('following').exec();
    // console.log(currUser.following)
    for (let iam of currUser.following) {
        if (iam.username == toFollowUsername) {
            req.flash('error', 'Already following')
            return res.redirect(`/users/${toFollowUsername}`)
        }
    }
    toFollow.followers.push(currUser);
    toFollow.save();
    currUser.following.push(toFollow);
    currUser.save();
    req.flash('success', 'Followed Successfully')
    res.redirect(`/users/${toFollowUsername}`);

})
router.get('/:userName/followers', isLoggedIn, async (req, res) => {
    var userF = await User.findOne({ username: req.params.userName }).populate('followers').exec();
    if (userF) {
        res.render('Users/followers', { followers: userF.followers });
    } else {
        res.send("No such User Exists");
    }
})
router.get('/:userName/following', isLoggedIn, async (req, res) => {
    var userF = await User.findOne({ username: req.params.userName })
    .populate('following')
    .populate('followers')
    .exec();
    if (userF) {
        res.render('Users/following', { following: userF.following,followers:userF.followers });
    } else {
        res.send("No such User Exists");
    }
})


module.exports=router;