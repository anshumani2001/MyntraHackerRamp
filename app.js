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
const Product=require('./models/product');
const app = express();

const passport = require('passport');
const LocalStrategy = require('passport-local');
const { findById } = require('./models/comment');

const dbUrl = 'mongodb://localhost:27017/hackerramp2';

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

//Social Media Routes

app.get('/posts', async (req, res) => {
    const posts = await Post.find({}).populate('author');
    res.render('posts/index', { posts });
});

app.get('/posts/new', isLoggedIn, (req, res) => {
    res.render('posts/new')
})

app.post('/posts', async (req, res) => {  //Post Req
    const { description, images } = req.body;
    // console.log(description, images)
    const newPost = new Post({ description, images });
    newPost.author = req.user._id;
    await newPost.save();
    req.flash('success', 'Posted the post');
    res.redirect('/posts')
    // res.send(req.body);
    // res.send('Post request after creating a <post>');
})

app.get('/posts/:id', async (req, res,) => {
    const post = await Post.findById(req.params.id).populate({
        path: 'comments',
        populate: {
            path: 'author'
        }
    }).populate('author');    
    res.render('posts/show', { post });
});

app.get('/posts/:id/edit', isLoggedIn, async (req, res) => {
    const post = await Post.findById(req.params.id);
    res.render('posts/edit', { post });
})

app.put('/posts/:id', async (req, res) => { //EDIT
    const { id } = req.params;
    // console.log(req.body);
    const post = await Post.findByIdAndUpdate(id, { description: req.body.description });
    await post.save();
    req.flash('success', "Post Edited")
    res.redirect('/posts/' + post._id);

})
//let counter=1;
app.get('/posts/:id/like',isLoggedIn,async (req,res)=>{
    const user=req.user;
    
    const {id}=req.params;
    const post =await Post.findById(id);
    post.likesCount+=1;
    //counter*=-1;

    await post.save();
    res.redirect('/posts/'+id);
   // console.log(post.likesCount);
})
//app.post('/posts/:id/like',)

app.post('/posts/:id/comments', async (req, res) => {
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



///Product Routes 
app.get('/products',async (req,res)=>{
    const products=await Product.find({});
  
    res.render('products/index',{products});
})

app.get('/products/pricesort1',async (req,res)=>{
    const products=await Product.find({});
    products.sort((a,b)=>
    { return a.price-b.price;});
    res.render('products/index',{products});
})

app.get('/products/pricesort2',async(req,res)=>{
    const products=await Product.find({});
    products.sort((a,b)=>
    { return a.price-b.price;});
    products.reverse();
    res.render('products/index',{products});
})

app.get('/products/new',isLoggedIn, (req,res)=>{
    res.render('products/new');
})

app.post('/products',async (req,res)=>{
   // res.send(req.body);
   const {name,price,image}=req.body;
  // console.log(name,price,image);
  const product=new Product({name,price,image});
    await product.save();
    req.flash('success','Product Created');
    res.redirect('/products');

})

app.get('/products/:id',async(req,res)=>{
    const{id}=req.params;
    const product=await Product.findById(id).populate({
        path: 'posts',
        populate: {
            path: 'author'
        }
    });
    res.render('products/show',{product});
})

app.delete('/products/:id', async(req,res)=>{
    const {id}=req.params;
    const product=await Product.findByIdAndDelete(id);
    req.flash('success','Product Deleted');
    res.redirect('/products');
})

app.get('/products/:id/newpost',isLoggedIn,(req,res)=>{
    res.render('products/newpost',{productid:req.params.id});
})

app.post('/products/:id/',async(req,res)=>{
    const { description, images } = req.body;
    const newPost = new Post({ description, images });
    const currProduct = await Product.findById(req.params.id);
    newPost.author = req.user._id;
    newPost.product = req.params.id;
    
    currProduct.posts.push(newPost);
    await newPost.save();
    await currProduct.save();
    req.flash('success', 'Posted the post');
    res.redirect('/posts')
    // res.send(req.body);
    // res.send('Post request after creating a <post>');
})


//USER ROUTES

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
    // console.log(req.user)
    const redirectUrl = req.session.returnTo || '/posts';
    delete req.session.returnTo;
    req.flash('success', 'Welcome Back');
    res.redirect(redirectUrl);
    
})

app.get('/users/:userName', async(req, res) => {
    var userF = await User.findOne({ username: req.params.userName}).exec();
    if (userF) {
        // console.log(userF)
        var userPosts = []
        const posts = await Post.find({}).populate('author');
        for (let post of posts) {
            // console.log(post.author)
            if (post.author && post.author.username == req.params.userName) {
                userPosts.push(post);
            }
        }
        // console.log(userPosts)
        res.render('Users/profile', {userF, userPosts})
    } else {
        res.send("No such User Exists");
    }
})

app.get('/users/:userName/followers', isLoggedIn, async (req, res) => {
    var userF = await User.findOne({ username: req.params.userName}).populate('followers').exec();
    if (userF) {
        res.render('Users/followers', {followers : userF.followers});
    } else {
        res.send("No such User Exists");
    }
})
app.get('/users/:userName/following', isLoggedIn, async (req, res) => {
    var userF = await User.findOne({ username: req.params.userName}).populate('following').exec();
    if (userF) {
        res.render('Users/following', {following : userF.following});
    } else {
        res.send("No such User Exists");
    }
})

app.post('/users/:userName/follow', isLoggedIn, async (req, res) => {
    const toFollowUsername = req.params.userName;
    const toFollow = await User.findOne({ username: toFollowUsername }).exec();
    const currUser = await User.findOne({ username: req.user.username }).populate('following').exec();
    console.log(currUser.following)
    for (let iam of currUser.following) {
        if (iam.username == toFollowUsername) {
            req.flash('error', 'Already following')
            res.redirect('/')
        }
    }
    toFollow.followers.push(currUser);
    toFollow.save();
    currUser.following.push(toFollow);
    currUser.save();
    req.flash('success', 'Followed Successfully')
    res.redirect('/');
    
})

app.get('/users',isLoggedIn,async (req,res)=>{
    const users=await User.find({});
    res.render('Users/meet',{users});
})

app.get('/logout', (req, res) => {
    req.logout();
    req.flash('success', "Goodbye!");
    res.redirect('/posts');
})


app.listen(3000, () => {
    console.log('Serving on port 3000')
})


// app.get("/users/:id/add", isLoggedIn, async(req, res) => {
//     // First finding the logged in user
//     User.findById(req.user._id, (err, user) => {
//         if (err) {
//             console.log(err);
//             req.flash(
//                 "error",
//                 "There has been an error adding this person to your friends list"
//             );
//             res.redirect("back");
//         } else {
//             // finding the user that needs to be added
//             User.findById(req.params.id, async(err, foundUser) => {
//                 if (err) {
//                     console.log(err);
//                     req.flash("error", "Person not found");
//                     res.redirect("back");
//                 } else {
//                     // FOUNDUSER IS THE USER THAT THE LOGGED IN USER WANTS TO ADD
//                     // USER IS THE CURRENT LOGGED IN USER

//                     // checking if the user is already in foundUsers friend requests or friends list
//                     if (foundUser.friends.find(o => o._id.equals(user._id))) {
//                         req.flash("error", `You already follow ${user.firstName}`);
//                         return res.redirect("back");
//                     } 
//                     let currUser = {_id: req.user._id, firstname: req.user.firstname, lastname: req.user.lastname};
//                     let currU = await User.findById(req.user._id);
//                     currU.friends.push(foundUser);
//                     currU.save();
//                     console.log(currU);
//                     req.flash("success", `Success! You started folowing ${foundUser.firstname}`);
//                     res.redirect("back");
//                 }
//             });
//         }
//     });
// });