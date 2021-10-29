let mongoose=require('mongoose');
let Schema=mongoose.Schema;

const ImageSchema = new Schema({
    url: String,
    filename: String
});

ImageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_100');
});

let productSchema=new Schema({
    
    name:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    images:[ImageSchema],
        
    
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