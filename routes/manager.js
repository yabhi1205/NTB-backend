require('dotenv/config')
const express = require('express')
const Manager = require('../modals/Manager')
const Admin = require('../modals/Admin')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const symbols = require('../validator/symbols')
const removepassword = require('../validator/removepassword')
const JWT_SECRET = process.env.JWT_SECRET
const router = express.Router()
const fetchmanager = require('../middlewares/verifymanager')
const fetchadmin = require('../middlewares/verifyadmin')
// to create a new manager
router.post('/create', fetchadmin,
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
        let manager = Manager(req.body)
        try {
            if (!validationResult(req).isEmpty()) {
                return res.status(400).json({ success: false, errors: validationResult(req).array() });
            }
            if (!req.admin) {
                return res.status(401).send({ success: false, error: 'Please Authenticate' })
            }
            else {
                let verifyadmin = await Admin.findById(req.admin.id).select('email')
                if (!verifyadmin) {
                    return res.status(401).send({ success: false, error: 'Please Authenticate' })
                }
                let manager_mail = await Manager.findOne({ email: req.body.email.toLowerCase() }).select('email')
                if (manager_mail) {
                    return res.status(401).send({ success: false, error: "Already have a manager" })

                }
                const salt = await bcrypt.genSalt(10);
                let hashpass = await bcrypt.hash(req.body.password, salt);
                manager = await Manager.create({
                    name: req.body.name.toUpperCase(),
                    email: req.body.email.toLowerCase(),
                    password: hashpass,
                })
                const data = {
                    manager: {
                        id: manager.id
                    }
                }
                const authtoken = jwt.sign(data, JWT_SECRET);
                res.send({ success: true, user: removepassword(manager), authtoken })

            }
        } catch (error) {
            res.status(404).send({ success: false, error: "Internal Server Error" })
            console.error(error)
        }
    })


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
            let manager = await Manager.findOne({ email:email.toLowerCase() }).select(['name','email','password'])
            if (!manager) {
                return res.status(401).json({ success: false, error: "Please try to login with correct credentials" });
            }
            const passwordCompare = await bcrypt.compare(password, manager.password);
            if (!passwordCompare) {
                return res.status(401).json({ success: false, error: "Please try to login with correct credentials" });
            }
            const data = {
                manager: {
                    id: manager.id
                }
            }
            const authtoken = jwt.sign(data, JWT_SECRET);
            res.json({ success: true, user: removepassword(manager), authtoken })

        } catch (error) {
            console.error(error.message);
            res.status(500).send({ success: false, error: "Internal Server Error" });
        }
    })

// get loggedin
router.post('/fetch', fetchmanager, async (req, res) => {
    try {
        if (!req.manager) {
            return res.status(401).send({ success: false, error: 'Please enter the valid token' })
        }
        let managerId = req.manager.id;
        const manager = await Manager.findById(managerId).select(['name','email'])
        if (!manager) {
            return res.status(401).send({ success: false, error: 'Please enter the valid token' })
        }
        else {
            res.send({ success: true, user: manager })
        }
    } catch (error) {
        res.status(500).send({ success: false, error: "Internal Server Error" });
        console.error(error)
    }
})
module.exports = router