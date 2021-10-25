const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const Post = require('./models/post');
const Comment = require('./models/comment');
const methodOverride = require('method-override');
const session = require('express-session');
const ExpressError = require('./utils/ExpressError');
const ejsMate = require('ejs-mate');

const app = express();
const dbUrl = 'mongodb://localhost:27017/hackerramp';

mongoose.connect(dbUrl, { useNewUrlParser: true });

const db = mongoose.connection;

db.on("error", console.error.bind(console, 'connection error'));
db.once('open', () => {
    console.log('database connected');
})

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

const sessionConfig = {
    secret: 'thisshouldbeabettersecret!',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig))

app.get('/', (req, res) => {
    res.render('home')
});

app.get('/posts', async (req, res) => {
    const posts = await Post.find({});
    res.render('posts/index', { posts });
});

app.get('/posts/new', (req, res) => {
    res.render('posts/new')
})

app.post('/posts', async (req, res) => {  //Post Req
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
    const post = await Post.findById(req.params.id).populate('comments');
    res.render('posts/show', { post });
});

app.get('/posts/:id/edit', async (req, res) => {
    const post = await Post.findById(req.params.id);
    res.render('posts/edit', { post });
})

app.put('/posts/:id', async (req, res) => { //EDIT
    const { id } = req.params;
    console.log(req.body);
    const post = await Post.findByIdAndUpdate(id, { description: req.body.description });
    await post.save();
    res.redirect('/posts/' + post._id);

})
app.post('/posts/:id/comments', async (req, res) => {
    //res.send('works');
    const post = await Post.findById(req.params.id);
    console.log(req.body);
    const comm = new Comment(req.body.comment);
    post.comments.push(comm);
    await comm.save()
    await post.save();
    res.redirect('/posts/' + post.id);
})
app.delete('/posts/:id/comments/:commentid', async (req, res) => {
    const { id, commentid } = req.params;
    await Post.findByIdAndUpdate(id, { $pull: { comments: commentid } });
    await Comment.findByIdAndDelete(req.params.commentid);
    res.redirect('/posts/' + id);


})
app.delete('/posts/:id', async (req, res) => { //DELETE
    const { id } = req.params;
    await Post.findByIdAndDelete(id);
    res.redirect('/posts');
})

app.get('/register', (req, res) => {
    res.render('Users/register.ejs');
})

app.post('/register', (req, res) => {
    res.send(req.body);
})

app.listen(3000, () => {
    console.log('Serving on port 3000')
})