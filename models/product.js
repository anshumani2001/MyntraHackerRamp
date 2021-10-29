let mongoose=require('mongoose');
let Schema=mongoose.Schema;
const Post = require('./post');

let productSchema=new Schema({
    
    name:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    images:[
        {
            url:String,
            filename:String
        }
    ],
        
    
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