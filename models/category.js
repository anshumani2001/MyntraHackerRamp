let mongoose=require('mongoose');
let Schema=mongoose.Schema;
let categorySchema=new Schema({
name:{
    type:String,
    unique:true,
    required:true
}
});
module.exports=mongoose.model("Category",categorySchema);