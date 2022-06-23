const mongoose = require('mongoose');
require('dotenv/config')
const databaseUri = process.env.databaseUri
// const mongoURI = "mongodb://localhost:27017/Users?readPreference=primary&appname=MongoDB%20Compass&ssl=false"
// const mongoURI = "mongodb+srv://yabhi1205:Abhinav%40123@ntb.etponjw.mongodb.net/?retryWrites=true&w=majority"
// const mongoURI = "mongodb+srv://abhishek:abhishek123@ntb.etponjw.mongodb.net/?retryWrites=true&w=majority"
const connectToMongo = () => {
    mongoose.connect(databaseUri, () => {
        console.log("Connected to Server Successfully...")
    })
}

module.exports = connectToMongo

// mongodb+srv://abhishek:abhishek123@ntb.etponjw.mongodb.net/test