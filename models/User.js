const mongoose = require('mongoose');
const { Schema } = mongoose;

const QuerySchema = new Schema({
    query: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const UserTypes = Object.freeze({
    ADMIN: 'ADMIN',
    PAID: 'PAID',
    FREE: 'FREE'
});

const UserSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password_hash: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    queries: {
        type: [QuerySchema],
        required: false
    },
    queryCount: {
        type: Number,
        default: 0
    },
    type: {
        type: String,
        enum: Object.values(UserTypes),
        default: UserTypes.FREE
    },
    verified: {
        type: Boolean,
        default: false
    }
});

// UserSchema.index({ maxTimeMS: 60000 });

const User = mongoose.model("user", UserSchema);
User.createIndexes();
module.exports = User;