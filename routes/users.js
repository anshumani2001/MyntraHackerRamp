const express=require('express');
const router=express.Router();
const catchAsync=require('../utils/catchAsync');
const User=require('../models/user');
const passport = require('passport');

router.get('/register',(req,res)=>{
    res.render('Users/register');
})
router.post('/register',catchAsync(async (req,res,next)=>{
    try {
        const { firstname, lastname, email, username, password, age, gender } = req.body;
        const user = new User({ firstname, secondname: lastname, email, username, age, gender });
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash('success', 'Successfully registered!');
            return res.redirect('/');
        })
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('/register');
    }
}))
router.get('/login',(req,res)=>{
    res.render('Users/login.ejs');
})
router.post('/login',passport.authenticate('local',{failureFlash:true,failureRedirect:'/register/login'}),(req,res)=>{
    const redirectUrl = req.session.returnTo || '/posts';
    delete req.session.returnTo;
    req.flash('success', 'Welcome Back');
    res.redirect(redirectUrl);
})
router.get('/logout',(req,res)=>{
    req.logout();
    req.flash('success', "Goodbye!");
    res.redirect('/');
})
module.exports=router;