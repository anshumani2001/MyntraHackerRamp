if(process.env.NODE_ENV!='production')
{
    require('dotenv').config();
}
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
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
const Chats = require('./models/Chats');
const { isLoggedIn } = require('./middleware');
const Product=require('./models/product');
const multer=require('multer');
const products = require('./routes/product');
const userRoutes = require('./routes/users');  
const passport = require('passport');
const LocalStrategy = require('passport-local');
const { findById } = require('./models/comment');
const {cloudinary,storage}=require('./cloudinary');
const upload=multer({storage})
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
app.use(express.static(path.join(__dirname, 'public')));

const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
    debug: true
});
app.use('/peerjs', peerServer)

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
    const users=await User.find({});
    let visiblePosts = [];
    for (let post of posts) {
        if ( req.user && post.author.username == req.user.username && post.author) {
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
    res.render('posts/index', { posts : visiblePosts, users });
});

app.get('/posts/new', isLoggedIn, (req, res) => {
    res.render('posts/new')
})

app.post('/posts',upload.array('image') ,async (req, res) => {  //Post Req
    const { description,  isPrivate } = req.body;
    console.log(req.body,req.files);
    // console.log(description, images)
    const newPost = new Post({ description,  isPrivate });
   newPost.images=req.files.map(f=>({url:f.path,filename:f.filename}));
   newPost.author = req.user._id;
   await newPost.save();
    console.log(newPost)
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

app.put('/posts/:id',upload.array('image'), async (req, res) => { //EDIT
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
app.use('/products',products);

//AUTH ROUTES

app.use('/', userRoutes)


app.get('/users/:userName', async(req, res) => {
    var userF = await User.findOne({ username: req.params.userName}).exec();
    if (userF) {
        // console.log(userF)
        let visiblePosts = [];
        const posts = await Post.find({}).populate('author');
        for (let post of posts) {
            // console.log(post.author)
            if (post.author && post.author.username == req.params.userName) {
                if (req.user && post.author.username == req.user.username && post.author&& req.user) {
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
        
        res.render('Users/profile', {userF, userPosts: visiblePosts})
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


app.get('/chatwith/:id', isLoggedIn, async (req, res) => {
    let currUser = await User.findOne({ username: req.user.username }).populate('myChats.chat').populate('myChats.user').exec();
    let otherUser = await User.findById(req.params.id);
    for (let chat of currUser.myChats) {
        if (chat.user._id + " " == req.params.id+" ") {
            res.redirect(`/chat/${chat.chat._id}`)
            // res.send("******");
            return;
        }
    }
    let newChat = new Chats({ user1: currUser, user2: otherUser });
    console.log(newChat);
    await newChat.save();
    let newChatForUSer1 = {
        user: otherUser,
        chat: newChat
    }
    let newChatForUSer2 = {
        user: currUser,
        chat: newChat
    }
    currUser.myChats.push(newChatForUSer1);
    await currUser.save();
    otherUser.myChats.push(newChatForUSer2);
    await otherUser.save();
    res.redirect(`/chat/${newChat._id}`)
    // res.send("########")

})


app.get('/chat/:id', isLoggedIn, async(req, res) => {
    ROOM_ID = req.params.room;
    // res.render('chat', {room: req.params.room})
    var chatF = await Chats.findById(req.params.id).populate('user1').populate('user2').exec();
    if (chatF) {
        res.render('chat', { chatF, uname: req.user.username, roomId: chatF._id });
    } else {
        req.flash('error', 'Error')
        res.redirect('/');
    }
})


io.on('connection', socket => {
    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId);
        socket.to(roomId).emit('user-connected', userId);
        socket.on('message', async(message) => {
            console.log(message, "app.js ")
            var newMsg = message
            message.userId = userId
            newMsg.sentAt = Date.now();
            // var x = newMsg.sentAt + ' ';
            await Chats.findByIdAndUpdate(roomId, { $push: { "messages": newMsg } });
            io.to(roomId).emit('createMessage', message)
        });
        socket.on('disconnect', () => {
            socket.to(roomId).emit('user-disconnected', userId)
        });
    })
})


server.listen(3000, () => {
    console.log('Serving on port 3000')
})