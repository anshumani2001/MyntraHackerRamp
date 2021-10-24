const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const methodOverride = require('method-override');
const ExpressError = require('./utils/ExpressError');
const ejsMate = require('ejs-mate'); 


const app=express();
/*const dbUrl='mongodb://localhost:27017/hackercamp';
mongoose.connect(dbUrl, { useNewUrlParser: true });

const db = mongoose.connection;
db.on("error", console.error.bind(console, 'connetion error'));
db.once('open', () => {
    console.log('database connected');
})*/
app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

app.get('/', (req, res) => {
    res.send('home')
});

app.get('/posts', (req, res) => {
    res.render('posts/index')
});

app.get('/posts/new', (req, res) => {
    res.render('posts/new.ejs')
})
// app.post('/posts/new', (req, res) => {
//     res.send(req.body);
// })
app.post('/posts', (req, res) => {  //Post Req
    res.send(req.body);
    // res.send('Post request after creating a <post>');
})

app.get('/posts/:id', async (req, res,) => {
    res.send('to show a particular post');
});

app.get('/posts/:id/edit', async (req, res) => {
    res.send('edit form');
})

app.put('/posts', (req, res) => { //EDIT
    res.send("For Making Edit Post  Request");
})
app.delete('/posts', (req, res) => { //DELETE
    res.send("For Deleting Posts");
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