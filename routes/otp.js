require('dotenv/config')
const express = require('express')
const dateTime = require('node-datetime');
const moment = require('moment')
const Otp = require('../modals/Otp')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const { body, validationResult, } = require('express-validator');
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

router.post('/reset', fetchuser, async (req, res) => {
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
                    let otp = await Otp.findByIdAndUpdate(userId,{password:hashpass},{new:true})
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

router.post('/fetch', fetchuser, async (req, res) => {
    try {
        userId = req.user.id;
        const user = await Otp.findById(userId)
        if (user) {
            var dt = dateTime.create();
            var formatted = dt.format('Y-m-d H:M:S');
            var startDate = moment(req.user.time, 'YYYY-M-DD HH:mm:ss')
            var endDate = moment(formatted, 'YYYY-M-DD HH:mm:ss')
            var secondsDiff = endDate.diff(startDate, 'seconds')

            // Waiting time has to change accordingly

            if (secondsDiff < 800) {
                const passwordCompare = await bcrypt.compare(req.body.password, user.password);
                if (!passwordCompare) {
                    return res.status(401).json({ success: false, error: "Please try to login with correct credentials" });
                }
                else {
                    await Otp.findByIdAndDelete(userId)
                    return res.status(200).send({ success: true, user: removepassword(user) })
                }
            }
            else {
                return res.status(408).send({ success: false, error: 'Session timeout' })
            }
        }
        else {
            return res.status(401).send({ success: false, error: 'Please enter the valid token2' })
        }
    } catch (error) {
        console.log(error)
        return res.status(500).send({ success: false, error: "Internal Server Error" });
    }
})

module.exports = router