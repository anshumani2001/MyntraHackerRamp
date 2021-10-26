let mongoose=require('mongoose');
let Schema=mongoose.Schema;
let productSchema=new Schema({
    category:{
        type:mongoose.SchemaTypes.ObjectId,
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
    }

});
module.exports=mongoose.model("Product",productSchema);