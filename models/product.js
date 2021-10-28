let mongoose=require('mongoose');
let Schema=mongoose.Schema;
const Post = require('./post');

let productSchema=new Schema({
    category:{
        type:Schema.Types.ObjectId,
        ref:'Category'
        
    },
    name:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    image:{
        type:String,
    },
    posts:[{
        type:Schema.Types.ObjectId,
        ref:'Post'
    }],

    deliverytime:{
        type:Number,
        default:1+Math.floor(Math.random()*10),

    }

});
module.exports=mongoose.model("Product",productSchema);