const express = require('express');
const connect = require('./db')
var cors = require('cors')
connect();
const app = express()
const port = 5000
app.use(cors())
app.use(express.json())
// Available Routes
app.use('/api/user',require('./routes/user'))
app.use('/api/admin',require('./routes/admin'))
app.use('/api/manager',require('./routes/manager'))
app.use('/api/books',require('./routes/books'))
app.use('/api/search',require('./routes/search'))
app.use('/api/otp',require('./routes/otp'))
app.listen(port,()=>{
    console.log(`We are listening at the localhost:${port}`);
})