const express=require('express');
const app=express();
const mongoose=require('mongoose');
const router=express.Router();
const Product=require('../models/product');
const {isLoggedIn}=require('../middleware');
const multer=require('multer');
const {cloudinary,storage}=require('../cloudinary');
const upload=multer({storage})
router.get('/',async (req,res)=>{
    const products=await Product.find({});
    const {prsearch}=req.query;
    if(prsearch==1)
    {
        products.sort((a,b)=>
    { return a.price-b.price;});
    }
    if(prsearch==2)
    {
        products.sort((a,b)=>
    { return a.price-b.price;});
    products.reverse();
    }
        
    if(prsearch==3)
    {
        products.sort((a,b)=>
    { return a.deliverytime-b.deliverytime;});
    }
    
    res.render('products/index',{products,prsearch});
})


router.get('/new',isLoggedIn, (req,res)=>{
    res.render('products/new');
})

router.post('/',upload.array('image'),async (req,res)=>{
   // res.send(req.body);
   const {name,price}=req.body;
  // console.log(name,price,image);
  
  console.log(req.body,req.files);

  const product=new Product({name,price});
  product.images=req.files.map(f=>({url:f.path,filename:f.filename}));
    await product.save();
    req.flash('success','Product Created');
    res.redirect('/products');

})

router.get('/:id',async(req,res)=>{
    const{id}=req.params;
    const product=await Product.findById(id).populate({
        path: 'posts',
        populate: {
            path: 'author'
        }
    });
    let posts = product.posts;
    let visiblePosts = []
    for (let post of posts) {
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
    product.posts = visiblePosts
    res.render('products/show',{product});
})

router.delete('/:id', async(req,res)=>{
    const {id}=req.params;
    const product=await Product.findByIdAndDelete(id);
    req.flash('success','Product Deleted');
    res.redirect('/products');
})

router.get('/:id/newpost',isLoggedIn,(req,res)=>{
    res.render('products/newpost',{productid:req.params.id});
})

router.post('/:id/',isLoggedIn, upload.array('image') ,async(req,res)=>{
    const { description, isPrivate } = req.body;
    console.log(req.files);
    const newPost = new Post({ description, isPrivate });
    const currProduct = await Product.findById(req.params.id);
    newPost.images = req.files.map(f=>({url:f.path,filename:f.filename}));
    newPost.author = req.user._id;
    newPost.product = req.params.id;
    currProduct.posts.push(newPost);
    await newPost.save();
    await currProduct.save();
    req.flash('success', 'Posted the post');
    res.redirect(`/products/${req.params.id}`)
    // res.send(req.body);
    // res.send('Post request after creating a <post>');
})

module.exports = router;