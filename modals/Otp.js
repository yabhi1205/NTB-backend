const mongoose = require('mongoose');
const { Schema } = mongoose;

const OtpSchema = new Schema({
    email:{
        type : String,
        unique: true,
        required : true
    },
    password:{
        type : String,
        required : true
    },
    timestamp:{
        type: Date,
        default: Date.now
    }
  });

module.exports = mongoose.model('otp',OtpSchema);