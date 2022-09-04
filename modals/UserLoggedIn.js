const mongoose = require('mongoose');
const {Formatted} = require('../validator/extended')
const { Schema } = mongoose;

// function arrayLimit(Array) {
//     if (Array.length < 5) {
//         Array.push({ time: Formatted() })
//     }
//     else {
//         for (let index = 0; index < max - 1; index++) {
//             Array[index] = Array[index + 1];
//         }
//         Array[max - 1] = { time: Formatted() }
//     }
//     return Array
//   }

const UserLoggedInSchema = new Schema({
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
        unique:true
    },
    auth_token:{
        unique:true,
        type:String,
        required:true
    },
    data:{
        type:Object,
        required:true
    },
    login_array:{
        type:Object,
        required:true
    }
    ,timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('UserLoggedIn', UserLoggedInSchema);