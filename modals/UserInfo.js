const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserInfoSchema = new Schema({
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    dob:{
        type:Date,
        required:true
    },
    occupation:{
        type:String,
        required:true,
        default: 'Guest'
    },
    phoneNo:{
        type:Number,
    },
    address:{
        pincode:{
            type:Number,
            minlength:6,
            maxlength:6
        },
        type:Object,    //[city, state, country, pincode]
    }
    ,timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('UserInfo', UserInfoSchema);