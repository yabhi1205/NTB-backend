require('dotenv/config')
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
const router = require('express').Router()
const fetchuser = require('../middlewares/verifyuser');
const UserLoggedIn = require('../modals/UserLoggedIn');
const UserInfo = require('../modals/UserInfo')
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
            const passwordCompare = await bcrypt.compare(req.body.onetimepassword.toString(), req.otp.password);
            if (!passwordCompare) {
                return res.status(401).json({ success: false, error: "Please try to login with correct credentials" });
            }
            else {
                let user_mail = await User.findOne({ email: req.body.email.toLowerCase() }).select('email')
                if (user_mail) {
                    return res.status(400).send({ success: false, error: "Already have a user" })

                }
                const salt = await bcrypt.genSalt(10);
                let hashpass = await bcrypt.hash(req.body.password, salt);
                let user = await User.create({
                    name: req.body.name.toUpperCase(),
                    email: req.body.email.toLowerCase(),
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
                await Otp.findByIdAndDelete(req.otp.id)
                return res.status(200).send({ success: true, user: removepassword(user), authtoken })
            }
        }
        catch (error) {
            return res.status(404).send({ success: false, error: "internal error" })
        }
    })

router.post('/userinfo', fetchuser, async (req, res) => {
    try {
        if (!validationResult(req).isEmpty()) {
            return res.status(400).json({ success: false, errors: validationResult(req).array() });
        }
        let checkuser = await UserInfo.findOne({userid:req.user.id})
        if(checkuser){
            return res.status(400).send({success:false,error:"User info already exists"})
        }
        let userinfo = {userid:req.user.id}
        if(req.body.alt_email){userinfo.alt_email = req.body.alt_email}
        if(req.body.gender){userinfo.gender = req.body.gender}
        if(req.body.age){userinfo.age = req.body.age}
        if(req.body.dob){userinfo.dob = req.body.dob}
        if(req.body.occupation){userinfo.occupation = req.body.occupation}
        if(req.body.phoneNo){userinfo.phoneNo = req.body.phoneNo}
        if(req.body.address.pincode){userinfo.address.pincode = req.body.address.pincode}
        if(req.body.address.city){userinfo.address.city = req.body.address.city}
        if(req.body.address.state){userinfo.address.state = req.body.address.state}
        if(req.body.address.country){userinfo.address.country = req.body.address.country}
        let user = await UserInfo.create(userinfo)
        if(!user){
            return res.status(400).send({success:false,error:"Please try after sometime"})
        }
        else{
            return res.status(200).send({success:true,userinfo})
        }
    } catch (error) {
        return res.status(500).send({ success: false, error: "Internal Server Error" });
    }
})

router.get('/fetch/userinfo',fetchuser,async(req,res)=>{
    try {
        let user = await UserInfo.findById(req.user.id)
        if(user){
            return res.status(200).send({success:true, user: removepassword(user)})
        }
        else{
            return res.status(204).send({success:false,error:"No info about the user"})
        }
    } catch (error) {
        return res.status(500).send({ success: false, error: "Internal Server Error" });
    }
})

// login
router.post('/login',
    [
        body('email', 'Please enter the valid email').exists().isEmail(),
        body('password', 'Enter password').exists().isLength({ min: 8 }),
    ], async (req, res) => {
        try {
            if (!validationResult(req).isEmpty()) {
                return res.status(400).json({ success: false, errors: validationResult(req).array() });
            }
            let user = await User.findOne({ email: req.body.email.toLowerCase() }).select(['name', 'email', 'password', 'block'])
            if (!user) {
                return res.status(401).json({ success: false, error: "Please try to login with correct credentials" });
            }
            if (user.block.Status) {
                return res.status(403).send({ success: false, error: "Too many logins (USER BLOCKED)1" })
            }
            let logged = await UserLoggedIn.findOne({ userid: user.id })
            if (logged && logged.login_array.time5 && TimeDiff(logged.login_array.time0) < 450) {
                await User.findByIdAndUpdate(user.id, {
                    block: {
                        Status: true,
                        NumberOfBlocks: (user.block.NumberOfBlocks < 5 ? user.block.NumberOfBlocks + 1 : user.block.NumberOfBlocks),
                        time: Formatted()
                    }
                })
                return res.status(403).send({ success: false, error: "Too many logins (USER BLOCKED)" })
            }
            const passwordCompare = await bcrypt.compare(req.body.password, user.password);
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
            output = await UserLog.findByIdAndUpdate(logged.id, {
                $set: {
                    data: data,
                    login_array: updateArray(logged.login_array),
                    auth_token: authtoken,
                },
            }, { new: true })
            // console.log(authtoken);
            return res.json({ success: true, user: removepassword(user), authtoken })
        } catch (error) {
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

router.post('/reset/password', verifyotp, [
    body('email', 'Please enter the valid email').exists().isEmail(),
    body('password', 'Enter password').exists().isLength({ min: 8 }),
], async (req, res) => {
    try {
        let user = await User.findOne({ email: req.body.email })
        if (!user) {
            // Waiting time has to change accordingly
            return res.status(401).send({ success: false, error: "Email doesn't exists" })
        }
        else {
            if (user.block.status && user.block.NumberOfBlocks == 5) {
                return res.status(423).send({ success: false, error: "User blocked due to voilations of terms and conditions." })
            }
            const passwordCompare = await bcrypt.compare(req.body.onetimepassword.toString(), req.otp.password);
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
    } catch (error) {
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