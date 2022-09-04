require('dotenv/config')
const express = require('express')
const dateTime = require('node-datetime');
const moment = require('moment')
const Otp = require('../modals/Otp')
const User = require('../modals/User')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const { validationResult, } = require('express-validator');
const sendotp = require('../validator/sendotp')
const removepassword = require('../validator/removepassword')
const JWT_SECRET = process.env.JWT_SECRET
const router = express.Router()
const fetchuser = require('../middlewares/verifyuser')

router.post('/', async (req, res) => {
    let otp = Otp(req.body)
    try {
        if (!validationResult(req).isEmpty()) {                                      // Checks the validation errors
            return res.status(400).json({ success: false, errors: validationResult(req).array() });
        }
        let user_otp = await Otp.findOne({ email: req.body.email.toLowerCase() }).select('email')       // Finds the otp in database for previous record
        if (user_otp) {
            return res.status(400).send({ success: false, error: "Already have a user" })
        }
        const salt = await bcrypt.genSalt(10);                                      // Creates the salt added to password
        let random_otp = Math.floor(100000 + Math.random() * 900000)                // Generates the random 6 digit number
        console.log(random_otp)
        sendotp(req.body.email.toLowerCase(), random_otp).then(async () => {        // Function call which sends the otp to the mail ids
            let hashpass = await bcrypt.hash(random_otp.toString(), salt);          // Generating the Hash of the password(OTP)
            otp = await Otp.create({                                                // Creates entry in the database for the record
                email: req.body.email.toLowerCase(),
                password: hashpass,
            })
            var dt = dateTime.create();                                             // Currnet date and time for the auth-token expiry
            var formatted = dt.format('Y-m-d H:M:S');
            const data = {                                                          // Data to be send in the auth-token
                user: {
                    email:req.body.email.toLowerCase(),
                    id: otp.id,
                    time: formatted
                }
            }
            const authtoken = jwt.sign(data, JWT_SECRET);                           // Creating an auth-token signed by the secret key
            return res.send({ success: true, user: removepassword(otp), authtoken })
        }).catch((err) => {                                                         // Error of not sending the email
            console.log(err)
            return res.status(503).send({ success: false, error: "Service Unavialable" })
        })

    } catch (error) {                                                               // Error of try catch
        console.log(error)
        return res.status(404).send({ success: false, error: "internal error" })
    }
})

router.post('/resend', fetchuser, async (req, res) => {
    try {
        if (!validationResult(req).isEmpty()) {                                      // Checks the validation errors
            return res.status(400).json({ success: false, errors: validationResult(req).array() });
        }
        userId = req.user.id;
        let user_otp = await Otp.findById(userId).select('email')                    // Finds the otp in database for previous record
        if (!user_otp) {
            return res.status(400).send({ success: false, error: "user doesnot exist" })
        }
        if (user_otp) {
            var dt = dateTime.create();                                               // Current date and time
            var formatted = dt.format('Y-m-d H:M:S');
            var startDate = moment(req.user.time, 'YYYY-M-DD HH:mm:ss')
            var endDate = moment(formatted, 'YYYY-M-DD HH:mm:ss')
            var secondsDiff = endDate.diff(startDate, 'seconds')                       // Time difference of auth-token created and current
            if (secondsDiff > 80) {                                                    // Time in secs for which auth-token is valid
                const salt = await bcrypt.genSalt(10);                                  // Generates the salt for password
                let random_otp = Math.floor(100000 + Math.random() * 900000)            // Generates the random 6 digit number
                console.log(random_otp)
                sendotp(user_otp.email.toLowerCase(), random_otp).then(async () => {     // Function call to send the email(OTP)
                    let hashpass = await bcrypt.hash(random_otp.toString(), salt);       // Generating the hash of the password
                    let otp = await Otp.findByIdAndUpdate(userId, { password: hashpass }, { new: true })       // Update the value of the password in database
                    const data = {                                                        // Data to be sent in auth-token
                        user: {
                            id: otp.id,
                            time: formatted
                        }
                    }
                    const authtoken = jwt.sign(data, JWT_SECRET);                          // Generating the auth-token signed by JWT_SECRET
                    return res.send({ success: true, user: removepassword(otp), authtoken })
                }).catch((err) => {                                                         // Email error
                    console.log(err)
                    return res.status(503).send({ success: false, error: "Service Unavialable" })
                })
            }
            else {
                return res.status(425).send({ success: false, error: 'too early request' })
            }
        }
    } catch (error) {
        console.log(error)
        return res.status(404).send({ success: false, error: "internal error" })
    }
})
router.post('/reset', async (req, res) => {
    try {
        let confirm_user = await User.findOne({ email: req.body.email.toLowerCase() }).select('email')      // Finding the user to be exists
        if (confirm_user) {
            let user_otp = await Otp.findOne({ email: req.body.email.toLowerCase() }).select('email')       // Already otp sent
            if (user_otp) {
                return res.status(400).send({ success: false, error: "Already Sent" })
            }
            const salt = await bcrypt.genSalt(10);                                                     // Generating the salt for password
            let random_otp = Math.floor(100000 + Math.random() * 900000)                               // Generating random 6 digit number
            console.log(random_otp)
            sendotp(req.body.email.toLowerCase(), random_otp).then(async () => {                        // sending otp to the mails
                let hashpass = await bcrypt.hash(random_otp.toString(), salt);                          // Generating the hash of the password
                otp = await Otp.create({                                                                // Creating the entry in the database
                    email: req.body.email.toLowerCase(),
                    password: hashpass,
                })
                var dt = dateTime.create();                                                              // time validation for auth-token
                var formatted = dt.format('Y-m-d H:M:S');
                const data = {
                    user: {
                        email:req.body.email.toLowerCase(),
                        id: otp.id,
                        time: formatted
                    }
                }
                const authtoken = jwt.sign(data, JWT_SECRET);
                return res.send({ success: true, user: removepassword(otp), authtoken })
            }).catch((err) => {
                console.log(err)
                return res.status(503).send({ success: false, error: "Service Unavialable" })
            })
        }
        else {
            return res.status(401).send({ success: false, error: "No user Found" })
        }
    } catch (error) {
        console.log(error)
        return res.status(404).send({ success: false, error: "internal error" })
    }
})
module.exports = router