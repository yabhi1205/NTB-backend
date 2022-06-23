require('dotenv/config')
const express = require('express')
const dateTime = require('node-datetime');
const moment = require('moment')
const User = require('../modals/User')
const Otp = require('../modals/Otp')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const { body, validationResult, param } = require('express-validator');
const symbols = require('../validator/symbols')
const removepassword = require('../validator/removepassword')
const JWT_SECRET = process.env.JWT_SECRET
const router = express.Router()
const fetchuser = require('../middlewares/verifyuser')
// to create a new user
router.post('/create', fetchuser,
    [
        body('name', 'Enter a valid name').isLength({ min: 5 }).custom(value => {
            if (!symbols.name(value)) {
                return Promise.reject('Enter the valid name')
            }
            return true
        }),
        body('email', 'Please enter the valid email').exists().custom(value => {
            if (!symbols.miet(value)) {
                return Promise.reject('Please enter the E-Mail of miet domain')
            }
            return true
        }),
        body('password', 'Password must be atleast 8 characters').isString().isLength({ min: 8 }),
    ],
    async (req, res) => {
        try {
            if (!validationResult(req).isEmpty()) {
                return res.status(400).json({ success: false, errors: validationResult(req).array() });
            }
            let user = User(req.body)
            userId = req.user.id;           //id from the auth-token
            let finduser = await Otp.findById(userId)       //find the id in otp database
            if (finduser && finduser.email == user.email) {
                var dt = dateTime.create();
                var formatted = dt.format('Y-m-d H:M:S');
                var startDate = moment(req.user.time, 'YYYY-M-DD HH:mm:ss')
                var endDate = moment(formatted, 'YYYY-M-DD HH:mm:ss')
                var secondsDiff = endDate.diff(startDate, 'seconds')

                // Waiting time has to change accordingly

                if (secondsDiff < 450) {
                    const passwordCompare = await bcrypt.compare(req.body.onetimepassword.toString(), finduser.password);
                    if (!passwordCompare) {
                        return res.status(401).json({ success: false, error: "Please try to login with correct credentials" });
                    }
                    else {
                        let user_mail = await User.findOne({ email: user.email.toLowerCase() }).select('email')
                        if (user_mail) {
                            return res.status(400).send({ success: false, error: "Already have a user" })

                        }
                        const salt = await bcrypt.genSalt(10);
                        let hashpass = await bcrypt.hash(user.password, salt);
                        user = await User.create({
                            name: user.name.toUpperCase(),
                            email: user.email.toLowerCase(),
                            password: hashpass,
                        })
                        const data = {
                            user: {
                                id: user.id,
                                time: formatted
                            }
                        }
                        const authtoken = jwt.sign(data, JWT_SECRET);
                        await Otp.findByIdAndDelete(userId)
                        return res.send({ success: true, user: removepassword(user), authtoken })
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
            return res.status(404).send({ success: false, error: "internal error" })
        }
    })

// login

router.post('/login',
    [
        body('email', 'Please enter the valid email').exists().custom(value => {
            if (!symbols.miet(value)) {
                return Promise.reject('Please enter the E-Mail of miet domain')
            }
            return true
        }),
        body('password', 'Enter password').exists().isLength({ min: 8 }),
    ],
    async (req, res) => {
        const { email, password } = req.body
        try {
            let user = await User.findOne({ email: email.toLowerCase() }).select(['name', 'email', 'password'])
            if (!user) {
                return res.status(401).json({ success: false, error: "Please try to login with correct credentials" });
            }
            const passwordCompare = await bcrypt.compare(password, user.password);
            if (!passwordCompare) {
                return res.status(401).json({ success: false, error: "Please try to login with correct credentials" });
            }
            var dt = dateTime.create();
            var formatted = dt.format('Y-m-d H:M:S');
            const data = {
                user: {
                    id: user.id,
                    time: formatted
                }
            }
            const authtoken = jwt.sign(data, JWT_SECRET);
            return res.json({ success: true, user: removepassword(user), authtoken })
        } catch (error) {
            return res.status(500).send({ success: false, error: "Internal Server Error" });
        }
    })


router.post('/edited/password', fetchuser, async (req, res) => {
    let userId = req.user.id
    try {
        let user = await User.findById(userId)
        if (user) {
            var dt = dateTime.create();
            var formatted = dt.format('Y-m-d H:M:S');
            var startDate = moment(req.user.time, 'YYYY-M-DD HH:mm:ss')
            var endDate = moment(formatted, 'YYYY-M-DD HH:mm:ss')
            var secondsDiff = endDate.diff(startDate, 'seconds')
            // if(secondsDiff<1,72,800){
            if (secondsDiff < 800) {
                const passwordCompare = await bcrypt.compare(req.body.password.toString(), user.password);
                if (!passwordCompare) {
                    return res.status(401).json({ success: false, error: "Please try to login with correct credentials" });
                }
                else {
                    const salt = await bcrypt.genSalt(10);
                    let hashpass = await bcrypt.hash(req.body.newpassword, salt);
                    let newuser = await User.findByIdAndUpdate(userId, { password: hashpass }, { new: true })
                    const data = {
                        user: {
                            id: user.id,
                            time: formatted
                        }
                    }
                    const authtoken = jwt.sign(data, JWT_SECRET);
                    return res.send({ success: true, user: removepassword(newuser), authtoken })
                }
            }
            else {
                return res.status(408).send({ success: false, error: 'Session timeout' })
            }
        }
        else {
            return res.status(401).send({ success: false, error: 'Please enter the valid token2' })
        }

    }
    catch (error) {
        console.log(error)
        return res.status(500).send({ success: false, error: "Internal Server Error" });
    }
})

router.post('/edited/name', fetchuser, async (req, res) => {
    let userId = req.user.id
    try {
        let user = await User.findById(userId).select(['name', 'email'])
        if (user) {
            var dt = dateTime.create();
            var formatted = dt.format('Y-m-d H:M:S');
            var startDate = moment(req.user.time, 'YYYY-M-DD HH:mm:ss')
            var endDate = moment(formatted, 'YYYY-M-DD HH:mm:ss')
            var secondsDiff = endDate.diff(startDate, 'seconds')
            // if(secondsDiff<1,72,800){
            if (secondsDiff < 800) {
                let newuser = await User.findByIdAndUpdate(userId, { name: req.body.name.toUpperCase() }, { new: true })
                const data = {
                    user: {
                        id: user.id,
                        time: formatted
                    }
                }
                const authtoken = jwt.sign(data, JWT_SECRET);
                return res.send({ success: true, user: removepassword(newuser), authtoken })
            }
            else {
                return res.status(408).send({ success: false, error: 'Session timeout' })
            }
        }
        else {
            return res.status(401).send({ success: false, error: 'Please enter the valid token2' })
        }

    }
    catch (error) {
        console.log(error)
        return res.status(500).send({ success: false, error: "Internal Server Error" });
    }
})

// get loggedin
router.post('/fetch', fetchuser, async (req, res) => {
    try {
        userId = req.user.id;
        const user = await User.findById(userId).select(['name', 'email'])
        if (user) {
            var dt = dateTime.create();
            var formatted = dt.format('Y-m-d H:M:S');
            var startDate = moment(req.user.time, 'YYYY-M-DD HH:mm:ss')
            var endDate = moment(formatted, 'YYYY-M-DD HH:mm:ss')
            var secondsDiff = endDate.diff(startDate, 'seconds')
            // if(secondsDiff<1,72,800){
            if (secondsDiff < 800) {
                return res.status(200).send({ success: true, user: user })
            }
            else {
                return res.status(408).send({ success: false, error: 'Session timeout' })
            }
        }
        else {
            return res.status(401).send({ success: false, error: 'Please enter the valid token2' })
        }
    } catch (error) {
        return res.status(500).send({ success: false, error: "Internal Server Error" });
    }
})

router.delete('/delete',fetchuser,async(req,res)=>{
    let user= User(req.body)
    try {
        
    } catch (error) {
        return res.status(404).send({ success: false, error: "Internal Server Error" })
    }
})

router.post('/reset/password',fetchuser,async(req,res)=>{
    try {
        userId = req.user.id;           //id from the auth-token
        let finduser = await Otp.findById(userId)       //find the id in otp database
        if (finduser) {
            var dt = dateTime.create();
            var formatted = dt.format('Y-m-d H:M:S');
            var startDate = moment(req.user.time, 'YYYY-M-DD HH:mm:ss')
            var endDate = moment(formatted, 'YYYY-M-DD HH:mm:ss')
            var secondsDiff = endDate.diff(startDate, 'seconds')

            // Waiting time has to change accordingly

            if (secondsDiff < 450) {
                const passwordCompare = await bcrypt.compare(req.body.onetimepassword.toString(), finduser.password);
                if (!passwordCompare) {
                    return res.status(401).json({ success: false, error: "Please try to login with correct credentials" });
                }
                else {
                    let user_mail = await User.findOne({ email: finduser.email.toLowerCase() })
                    if (!user_mail) {
                        return res.status(400).send({ success: false, error: "User doesn't exists" })

                    }
                    console.log(user_mail)
                    const salt = await bcrypt.genSalt(10);
                    let hashpass = await bcrypt.hash(req.body.password, salt);
                    let user = await User.findByIdAndUpdate(user_mail.id,{password:hashpass},{new:true})
                    const data = {
                        user: {
                            id: user.id,
                            time: formatted
                        }
                    }
                    const authtoken = jwt.sign(data, JWT_SECRET);
                    await Otp.findByIdAndDelete(userId)
                    return res.send({ success: true, user: removepassword(user), authtoken })
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
        return res.status(404).send({ success: false, error: "internal error" })
    }
})

router.get('/check/:email',
    [
        param('email', 'Please enter the valid email').exists().custom(value => {
            if (!symbols.miet(value)) {
                return Promise.reject('Please enter the E-Mail of miet domain')
            }
            return true
        })
    ],
    async (req, res) => {
        if (!validationResult(req).isEmpty()) {
            return res.status(400).json({ success: false, errors: validationResult(req).array() })
        }
        try {
            let newuser = await User.findOne({ email: req.params.email.toLowerCase() }).select('email')
            if (!newuser) {
                return res.status(200).send({ success: true, error: "User don't Exists" })
            }
            else {
                return res.status(409).send({ success: false, error: 'User Exists' })
            }

        } catch (error) {
            return res.status(500).send({ success: false, error: "Internal Server Error" });
        }
    })

module.exports = router