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
        if (!validationResult(req).isEmpty()) {
            return res.status(400).json({ success: false, errors: validationResult(req).array() });
        }
        let user_otp = await Otp.findOne({ email: req.body.email.toLowerCase() }).select('email')
        if (user_otp) {
            return res.status(400).send({ success: false, error: "Already have a user" })
        }
        const salt = await bcrypt.genSalt(10);
        let random_otp = Math.floor(100000 + Math.random() * 900000)
        console.log(random_otp)
        sendotp(req.body.email.toLowerCase(), random_otp).then(async () => {
            let hashpass = await bcrypt.hash(random_otp.toString(), salt);
            otp = await Otp.create({
                email: req.body.email.toLowerCase(),
                password: hashpass,
            })
            var dt = dateTime.create();
            var formatted = dt.format('Y-m-d H:M:S');
            const data = {
                user: {
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

    } catch (error) {
        console.log(error)
        return res.status(404).send({ success: false, error: "internal error" })
    }
})

router.post('/resend', fetchuser, async (req, res) => {
    try {
        if (!validationResult(req).isEmpty()) {
            return res.status(400).json({ success: false, errors: validationResult(req).array() });
        }
        userId = req.user.id;
        let user_otp = await Otp.findById(userId).select('email')
        if (!user_otp) {
            return res.status(400).send({ success: false, error: "user doesnot exist" })
        }
        if (user_otp) {
            var dt = dateTime.create();
            var formatted = dt.format('Y-m-d H:M:S');
            var startDate = moment(req.user.time, 'YYYY-M-DD HH:mm:ss')
            var endDate = moment(formatted, 'YYYY-M-DD HH:mm:ss')
            var secondsDiff = endDate.diff(startDate, 'seconds')
            if (secondsDiff > 80) {
                const salt = await bcrypt.genSalt(10);
                let random_otp = Math.floor(100000 + Math.random() * 900000)
                console.log(random_otp)
                sendotp(user_otp.email.toLowerCase(), random_otp).then(async () => {
                    let hashpass = await bcrypt.hash(random_otp.toString(), salt);
                    let otp = await Otp.findByIdAndUpdate(userId, { password: hashpass }, { new: true })
                    const data = {
                        user: {
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
        let confirm_user = await User.findOne({ email: req.body.email.toLowerCase() }).select('email')
        if (confirm_user) {
            let user_otp = await Otp.findOne({ email: req.body.email.toLowerCase() }).select('email')
            if (user_otp) {
                return res.status(400).send({ success: false, error: "Already Sent" })
            }
            const salt = await bcrypt.genSalt(10);
            let random_otp = Math.floor(100000 + Math.random() * 900000)
            console.log(random_otp)
            sendotp(req.body.email.toLowerCase(), random_otp).then(async () => {
                let hashpass = await bcrypt.hash(random_otp.toString(), salt);
                otp = await Otp.create({
                    email: req.body.email.toLowerCase(),
                    password: hashpass,
                })
                var dt = dateTime.create();
                var formatted = dt.format('Y-m-d H:M:S');
                const data = {
                    user: {
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