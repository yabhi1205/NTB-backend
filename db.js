const mongoose = require('mongoose');
const mongoURI = "mongodb://localhost:27017/Users?readPreference=primary&appname=MongoDB%20Compass&ssl=false"
const connectToMongo =()=>{
    mongoose.connect(mongoURI,()=>{
const mongoURI = "mongodb+srv://abhishek:abhishek123@ntb.etponjw.mongodb.net/?retryWrites=true&w=majority"
const connectToMongo = () => {
    mongoose.connect(mongoURI, () => {
        console.log("Connected to Server Successfully...")
    })
}

module.exports = connectToMongo