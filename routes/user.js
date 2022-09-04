require('dotenv/config')
const express = require('express')
const User = require('../modals/User')
const Otp = require('../modals/Otp')
const UserLog = require('../modals/UserLoggedIn')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const { body, validationResult, param } = require('express-validator');
const symbols = require('../validator/symbols')
const removepassword = require('../validator/removepassword')
const { updateArray, TimeDiff, Formatted } = require('../validator/extended')
const JWT_SECRET = process.env.JWT_SECRET
const router = express.Router()
const fetchuser = require('../middlewares/verifyuser');
const UserLoggedIn = require('../modals/UserLoggedIn');
const verifyotp = async (req, res, next) => {
    const token = req.header('auth-token')
    if (!token) {
        return res.status(401).send({ success: false, error: "Please authentiate with correct crediantials1" })
    }
    try {
        const data = jwt.verify(token, JWT_SECRET)
        let otp = await Otp.findById(data.user.id)
        if (otp.email == req.body.email && TimeDiff(data.user.time) < 4050) {
            req.otp = otp
            next()
        }
        else {
            return res.status(401).send({ success: false, error: "Please authentiate with correct crediantials2" })
        }
    } catch (error) {
        return res.status(401).send({ success: false, error: "Please authentiate with correct crediantials3" })
    }

}
// to create a new user
router.post('/create', verifyotp,
    [
        body('name', 'Enter a valid name').isLength({ min: 5 }).custom(value => {
            if (!symbols.name(value)) {
                return Promise.reject('Enter the valid name')
            }
            return true
        }),
        body('email', 'Please enter the valid email').exists().isEmail(),
        body('password', 'Password must be atleast 8 characters').isString().isLength({ min: 8 }),
    ],
    async (req, res) => {
        try {
            if (!validationResult(req).isEmpty()) {
                return res.status(400).json({ success: false, errors: validationResult(req).array() });
            }
            let user = User(req.body)
            const passwordCompare = await bcrypt.compare(req.body.onetimepassword.toString(), req.otp.password);
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
                        time: Formatted()
                    }
                }
                const authtoken = jwt.sign(data, JWT_SECRET);
                output = await UserLog.create({
                    userid: user.id,
                    data: data,
                    login_array: { time0: Formatted() },
                    auth_token: authtoken,
                })
                // await Otp.findByIdAndDelete(req.otp.id)
                return res.send({ success: true, user: removepassword(user), authtoken })
            }
        }
        catch (error) {
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
            let user = await User.findOne({ email: email.toLowerCase() }).select(['name', 'email', 'password', 'block'])
            if (!user) {
                return res.status(401).json({ success: false, error: "Please try to login with correct credentials" });
            }
            if (user.block.Status) {
                return res.status(403).send({ success: false, error: "Too many logins (USER BLOCKED)1" })
            }
            let logged = await UserLoggedIn.findOne({ userid: user.id })
            // console.log(user.id);
            // console.log(logged);
            if (logged && TimeDiff(logged.login_array.time0) < 450) {
                let blocked = await User.findByIdAndUpdate(user.id, {
                    block: {
                        Status: true,
                        NumberOfBlocks: (user.block.NumberOfBlocks < 5 ? user.block.NumberOfBlocks + 1 : user.block.NumberOfBlocks),
                        time: Formatted()
                    }
                })
                // console.log(blocked);
                return res.status(403).send({ success: false, error: "Too many logins (USER BLOCKED)" })
            }
            const passwordCompare = await bcrypt.compare(password, user.password);
            if (!passwordCompare) {
                return res.status(401).json({ success: false, error: "Please try to login with correct credentials" });
            }
            const data = {
                user: {
                    id: user.id,
                    time: Formatted()
                }
            }
            const authtoken = jwt.sign(data, JWT_SECRET);
            // console.log(logged.login_array);
            output = await UserLog.findByIdAndUpdate(logged.id, {
                $set: {
                    data: data,
                    login_array: updateArray(logged.login_array),
                    auth_token: authtoken,
                },
            }, { new: true })
            // console.log(user);
            return res.json({ success: true, user: removepassword(user), authtoken })
        } catch (error) {
            console.log(error)
            return res.status(500).send({ success: false, error: "Internal Server Error" });
        }
    })

router.post('/edited/password', fetchuser, async (req, res) => {
    try {
        let user = await User.findById(req.user.id)
        if (user) {
            // if(secondsDiff<1,72,800){
            if (TimeDiff(req.user.time) < 800) {
                let passwordCompare = await bcrypt.compare(req.body.password.toString(), user.password);
                if (!passwordCompare) {
                    return res.status(401).json({ success: false, error: "Please try to login with correct credentials" });
                }
                else {
                    passwordCompare = await bcrypt.compare(req.body.newpassword.toString(), user.password);
                    if (passwordCompare) {
                        return res.status(403).json({ success: false, error: "Can't set the previous password" });
                    }
                    const salt = await bcrypt.genSalt(10);
                    let hashpass = await bcrypt.hash(req.body.newpassword, salt);
                    let newuser = await User.findByIdAndUpdate(req.user.id, { password: hashpass })
                    const data = {
                        user: {
                            id: user.id,
                            time: Formatted()
                        }
                    }
                    const authtoken = jwt.sign(data, JWT_SECRET);
                    output = await UserLog.findByIdAndUpdate(req.logged.id, {
                        $set: {
                            data: data,
                            login_array: updateArray(req.logged.login_array),
                            auth_token: authtoken,
                        },
                    }, { new: true })
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
    try {
        let user = await User.findById(req.user.id).select(['name', 'email'])
        if (user) {
            var dt = dateTime.create();
            var formatted = dt.format('Y-m-d H:M:S');
            var startDate = moment(req.user.time, 'YYYY-M-DD HH:mm:ss')
            var endDate = moment(formatted, 'YYYY-M-DD HH:mm:ss')
            var secondsDiff = endDate.diff(startDate, 'seconds')
            // if(secondsDiff<1,72,800){
            if (secondsDiff < 800) {
                let newuser = await User.findByIdAndUpdate(req.user.id, { name: req.body.name.toUpperCase() }, { new: true })
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
        const user = await User.findById(req.user.id).select(['name', 'email'])
        if (user) {
            // if(secondsDiff<1,72,800){
            if (TimeDiff(req.user.time) < 800) {
                return res.status(200).send({ success: true, user: removepassword(user) })
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

router.delete('/delete', fetchuser, async (req, res) => {
    let user = User(req.body)
    try {

    } catch (error) {
        return res.status(404).send({ success: false, error: "Internal Server Error" })
    }
})

router.post('/reset/password', fetchuser, async (req, res) => {
    try {
        let user = await User.findOne
        let finduser = await Otp.findById(req.user.id)       //find the id in otp database
        if (finduser) {
            // Waiting time has to change accordingly

            if (TimeDiff(req.user.time) < 450) {
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
                    let user = await User.findByIdAndUpdate(user_mail.id, { password: hashpass }, { new: true })
                    const data = {
                        user: {
                            id: user.id,
                            time: formatted
                        }
                    }
                    const authtoken = jwt.sign(data, JWT_SECRET);
                    await Otp.findByIdAndDelete(req.user.id)
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
        param('email', 'Please enter the valid email').exists().isEmail()
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