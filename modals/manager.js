const mongoose = require('mongoose');
const { Schema } = mongoose;

const ManagerSchema = new Schema({
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
    timestamp:{
        type: Date,
        default: Date.now
    }
  });

module.exports = mongoose.model('manager',ManagerSchema);