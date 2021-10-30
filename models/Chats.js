const mongoose = require('mongoose');
const User = require('./user')
const Schema = mongoose.Schema;

const ChatChatSchema = new mongoose.Schema({
    user1: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    user2: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    messages: [{
        message: {
            type: String,
            required: true
        },
        sentBy: {
            type: String,
            default: "Anonymous"
        },
        sentAt: {
            type: Date,
            default: Date.now()
        }
    }]
});

module.exports = mongoose.model('chats', ChatChatSchema);