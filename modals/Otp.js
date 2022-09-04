const mongoose = require('mongoose');
const { Schema } = mongoose;

const OtpSchema = new Schema({
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    tried: {
        type: Number,
        required: true,
        default: 0
    },
    lastTried: {
        type: Date,
        required: true,
        default: Date.now
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('otp', OtpSchema);