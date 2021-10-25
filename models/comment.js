
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
    body: String,
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    postedAt: {
        type: Date,
        default: Date.now()
    }
});

module.exports = mongoose.model("Comment", commentSchema);

