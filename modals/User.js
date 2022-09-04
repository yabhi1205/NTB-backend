const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
    name:{
        type: String,
        required: true
    },
    email:{
        type : String,
        unique: true,
        required : true
    },
    password:{
        type : String,
        required : true
    },
    block:{
        Status:{
            type:Boolean,
            default:false,
            required:true
        },
        NumberOfBlocks:{
            type:Number,
            default:0,
            max:5,
            maxlength:1,
            min:0
        },
        time:{
            type:Date,
            required:false,
        }
    },
    timestamp:{
        type: Date,
        default: Date.now
    }
  });

module.exports = mongoose.model('user',UserSchema);