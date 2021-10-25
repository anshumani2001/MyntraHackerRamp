const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const Post = require('./models/post');
const methodOverride = require('method-override');
const ExpressError = require('./utils/ExpressError');
const ejsMate = require('ejs-mate'); 

const app=express();
const dbUrl='mongodb://localhost:27017/hackerramp';

mongoose.connect(dbUrl, { useNewUrlParser: true });

const db = mongoose.connection;

db.on("error", console.error.bind(console, 'connetion error'));
db.once('open', () => {
    console.log('database connected');
})

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

app.get('/', (req, res) => {
    res.send('home')
});

app.get('/posts', async(req, res) => {
    const posts = await Post.find({});
    res.render('posts/index',{posts});
});

app.get('/posts/new', (req, res) => {
    res.render('posts/new')
})

app.post('/posts', async(req, res) => {  //Post Req
    const { description, images } = req.body;
    console.log(description, images)
    const newPost = new Post({ description, images });
    console.log(newPost);
    await newPost.save();
    res.redirect('/posts')
    // res.send(req.body);
    // res.send('Post request after creating a <post>');
})

app.get('/posts/:id', async (req, res,) => {
    const post = await Post.findById(req.params.id)
    res.render('posts/show', { post });
});

app.get('/posts/:id/edit', async (req, res) => {
    res.send('edit form');
})

app.put('/posts', (req, res) => { //EDIT
    res.send("For Making Edit Post  Request");
})

app.delete('/posts/:id', async (req, res) => { //DELETE
    const { id } = req.params;
    await Post.findByIdAndDelete(id);
    res.redirect('/posts');
})

app.get('/register',(req,res)=>{
    res.render('Users/register.ejs');
})

app.post('/register',(req,res)=>{
    res.send(req.body);
})

app.listen(3000, () => {
    console.log('Serving on port 3000')
})