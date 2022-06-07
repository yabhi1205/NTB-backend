require('dotenv/config')
const express = require('express')
const dateTime = require('node-datetime');
const moment = require('moment')
const Admin = require('../modals/Admin')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const removepassword = require('../validator/removepassword')
const JWT_SECRET = process.env.JWT_SECRET
const router = express.Router()
const fetchadmin = require('../middlewares/verifyadmin')
// login

router.post('/login',
    [
        body('email', 'Please enter the valid email').exists().isEmail(),
        body('password', 'Enter password').exists().isLength({ min: 8 }),
    ],
    async (req, res) => {
        const { email, password } = req.body
        try {
            if (!validationResult(req).isEmpty()) {
                return res.status(400).json({ success: false, errors: validationResult(req).array() });
            }
            let admin = await Admin.findOne({ email }).select(['_id', 'name', 'email', 'password'])
            if (!admin) {
                return res.status(401).json({ success: false, error: "Please try to login with correct credentials" });
            }
            const passwordCompare = await bcrypt.compare(password, admin.password);
            if (!passwordCompare) {
                return res.status(401).json({ success: false, error: "Please try to login with correct credentials" });
            }
            var dt = dateTime.create();
            var formatted = dt.format('Y-m-d H:M:S');
            const data = {
                admin: {
                    id: admin.id,
                    time: formatted
                }
            }
            const authtoken = jwt.sign(data, JWT_SECRET);
            return res.json({ success: true, user: removepassword(admin), authtoken })

        } catch (error) {
            return res.status(500).send({ success: false, error: "Internal Server Error" });
        }
    })

// get loggedin
router.post('/fetch', fetchadmin, async (req, res) => {
    try {
        if (!req.admin) {
            return res.status(401).send({ success: false, error: 'Please enter the valid token1' })
        }
        const admin = await Admin.findById(req.admin.id).select(['name', 'email'])
        if (admin) {
            var dt = dateTime.create();
            var formatted = dt.format('Y-m-d H:M:S');
            var startDate = moment(req.admin.time, 'YYYY-M-DD HH:mm:ss')
            var endDate = moment(formatted, 'YYYY-M-DD HH:mm:ss')
            var secondsDiff = endDate.diff(startDate, 'seconds')
            // if(secondsDiff<1,72,800){
            if (secondsDiff < 800) {
                return res.status(200).send({ success: true, user: admin })
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
module.exports = router