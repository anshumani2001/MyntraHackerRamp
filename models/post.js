const mongoose = require('mongoose');
const Comment = require('./comment');
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
    url: String,
    filename: String
});

// ImageSchema.virtual('thumbnail').get(function () {
//     return this.url.replace('/upload', '/upload/w_200');
// });

const opts = { toJSON: { virtuals: true } };

const PostSchema = new Schema({
    image: { type: String },
    description: String,
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    postedAt: {
        type: Date,
        default: Date.now()
    },
    likesCount: {
        type: Number,
        default: 0
    },
    likes:[{
            type: Schema.Types.ObjectId,
            ref: 'User'
    }],
    comments: [{
            type: Schema.Types.ObjectId,
            ref: 'Comment'
    }]
}, opts);

PostSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await Comment.deleteMany({
            _id: {
                $in: doc.comments
            }
        })
    }
})

module.exports = mongoose.model('Post', PostSchema);