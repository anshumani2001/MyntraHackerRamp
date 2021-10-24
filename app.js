const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const methodOverride = require('method-override');
const ExpressError = require('./utils/ExpressError');
const ejsMate = require('ejs-mate'); 


const app=express();

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

app.get('/', (req, res) => {
    res.render('posts/index')
});

app.listen(3000, () => {
    console.log('Serving on port 3000')
})