require('dotenv/config')
const UserLoggedIn = require('../modals/UserLoggedIn');
const JWT_SECRET = process.env.JWT_SECRET
const jwt = require('jsonwebtoken')
const fetchuser = async (req, res, next) => {
    const token = req.header('auth-token')
    if (!token) {
        return res.status(401).send({ success: false, error: "Please authentiate with correct crediantials" })
    }
    try {
        const data = jwt.verify(token, JWT_SECRET)
        let logged = await UserLoggedIn.findOne({ auth_token: token })
        if (!logged || JSON.stringify(logged.data.user) != JSON.stringify(data.user) || logged.auth_token != token) {
            return res.status(401).send({ success: false, error: "Invalid crediantials" })
        }
        else {
            req.user = data.user
            req.logged = logged
            next()
        }
    } catch (error) {
        return res.status(401).send({ success: false, error: "Internal Server Error" })
    }
}
module.exports = fetchuser