const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const Post = require('./models/post');
const Comment = require('./models/comment');
const methodOverride = require('method-override');
const session = require('express-session');
const flash = require('connect-flash');
const ExpressError = require('./utils/ExpressError');
const ejsMate = require('ejs-mate');
const User = require('./models/user');
const { isLoggedIn } = require('./middleware');

const app = express();

const passport = require('passport');
const LocalStrategy = require('passport-local');


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
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

app.get('/', (req, res) => {
    res.render('home')
});

app.get('/posts', async (req, res) => {
    const posts = await Post.find({});
    res.render('posts/index', { posts });
});

app.get('/posts/new', isLoggedIn, (req, res) => {
    res.render('posts/new')
})

app.post('/posts', async (req, res) => {  //Post Req
    const { description, images } = req.body;
    console.log(description, images)
    const newPost = new Post({ description, images });
    console.log(newPost);
    await newPost.save();
    req.flash('success', 'Posted the post');
    res.redirect('/posts')
    // res.send(req.body);
    // res.send('Post request after creating a <post>');
})

app.get('/posts/:id', async (req, res,) => {
    const post = await Post.findById(req.params.id).populate('comments');
    res.render('posts/show', { post });
});

app.get('/posts/:id/edit', isLoggedIn, async (req, res) => {
    const post = await Post.findById(req.params.id);
    res.render('posts/edit', { post });
})

app.put('/posts/:id', async (req, res) => { //EDIT
    const { id } = req.params;
    console.log(req.body);
    const post = await Post.findByIdAndUpdate(id, { description: req.body.description });
    await post.save();
    req.flash('success', "Post Edited")
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
    req.flash('success', 'Comment Added')
    res.redirect('/posts/' + post.id);
})

app.delete('/posts/:id/comments/:commentid', async (req, res) => {
    const { id, commentid } = req.params;
    await Post.findByIdAndUpdate(id, { $pull: { comments: commentid } });
    await Comment.findByIdAndDelete(req.params.commentid);
    req.flash('success', "Comment Deleted");
    res.redirect('/posts/' + id);


})

app.delete('/posts/:id', async (req, res) => { //DELETE
    const { id } = req.params;
    await Post.findByIdAndDelete(id);
    req.flash('success', 'Post was deleted');
    res.redirect('/posts');
})

app.get('/register', (req, res) => {
    res.render('Users/register.ejs');
})

app.post('/register', async (req, res, next) => {
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
    // res.send(req.body);
})

app.get('/login', (req, res) => {
    res.render('Users/login.ejs');
})

app.post('/login', passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), async (req, res) => {
    console.log(req.user)
    const redirectUrl = req.session.returnTo || '/posts';
    delete req.session.returnTo;
    req.flash('success', 'Welcome Back');
    res.redirect(redirectUrl);
    
})

app.get('/logout', (req, res) => {
    req.logout();
    req.flash('success', "Goodbye!");
    res.redirect('/posts');
})


app.listen(3000, () => {
    console.log('Serving on port 3000')
})