const mongoose =require('mongoose')
const { Schema } = mongoose;

const BooksSchema = new Schema({
    name:{
        type: String,
        required: true
    },
    author:{
        type: String,
        required: true
    },
    bookId:{
        type : Number,
        unique: true,
        required : true
    },
    branch:{
        type : String,
        required : true
    },
    subject:{
        type : String,
        required : true
    },
    timestamp:{
        type: Date,
        default: Date.now
    }
  });

module.exports = mongoose.model('books',BooksSchema);