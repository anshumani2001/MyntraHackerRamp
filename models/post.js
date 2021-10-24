const mongoose = require('mongoose');
const comment = require('./comment')
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
    url: String,
    filename: String
});

ImageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_200');
});

const opts = { toJSON: { virtuals: true } };

const PostSchema = new Schema({
    images: [{ type: String }],
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
            ref: 'comment'
    }]
}, opts);


PostSchema.virtual('properties.popUpMarkup').get(function () {
    return `
    <strong><a href="/campgrounds/${this._id}">${this.title}</a><strong>
    <p>${this.description.substring(0, 20)}...</p>`
});



PostSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await comment.deleteMany({
            _id: {
                $in: doc.comments
            }
        })
    }
})

module.exports = mongoose.model('Campground', PostSchema);