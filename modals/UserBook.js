const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserBookSchema = new Schema({
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
        unique:true
    },
    books:{
        type:o

    }
    ,timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('UserBook', UserBookSchema);