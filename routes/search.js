const express = require('express')
const router = express.Router()
const { body, validationResult, param } = require('express-validator');
const fetchadmin = require('../middlewares/verifyadmin')
const fetchmanager = require('../middlewares/verifymanager')
const fetchuser = require('../middlewares/verifyuser')
const symbols = require('../validator/symbols')
const Books = require('../modals/Books')
const User = require('../modals/User')
const Admin = require('../modals/Admin')
const Manager = require('../modals/Manager');
const req = require('express/lib/request');
//       Api for all the books



router.get('/all', fetchuser, fetchmanager, fetchadmin, async (req, res) => {
    let finaluser = null
    if (req.admin) {
        adminId = req.admin.id;
        finaluser = await Admin.findById(adminId)
    }
    else {
        if (req.manager) {
            managerId = req.manager.id;
            finaluser = await Manager.findById(managerId)
        }
        if (req.user) {
            userId = req.user.id;
            finaluser = await User.findById(userId)
        }
    }
    if (!req.admin && !req.user && !req.manager) {
        return res.status(401).send({ success: false, error: 'please login' })
    }
    if (!finaluser) {
        return res.status(401).send({ success: false, error: 'please signup' })
    }
    let allBook = await Books.find()
    if (!allBook) {
        return res.status(401).send({ success: false, error: 'Please enter the valid token' })
    }
    else {
        return res.send({ success: true, allBook })
    }
})


router.get('/author=:author', fetchadmin, fetchmanager, fetchuser,
    [
        param("author", 'Please enter the valid name for Author').isLength({ min: 5 }).custom(value => {
            if (!symbols.name(value)) {
                return Promise.reject('Enter the valid name')
            }
            return true
        })
    ],
    async (req, res) => {
        if (!validationResult(req).isEmpty()) {
            return res.status(400).json({ errors: validationResult(req).array() })
        }
        let finaluser = null
        if (req.admin) {
            adminId = req.admin.id;
            finaluser = await Admin.findById(adminId)
        }
        else {
            if (req.manager) {
                managerId = req.manager.id;
                finaluser = await Manager.findById(managerId)
            }
            if (req.user) {
                userId = req.user.id;
                finaluser = await User.findById(userId)
            }
        }
        if (!req.admin && !req.user && !req.manager) {
            return res.status(401).send({ success: false, error: 'please login' })
        }
        if (!finaluser) {
            return res.status(401).send({ success: false, error: 'please signup' })
        }
        try {
            let subjectBook = await Books.find({ author: req.params.author.toUpperCase()})
            if (!subjectBook) {
                return res.status(401).send({ success: false, error: 'No book found' })
            }
            else {
                return res.send({ success: true, subjectBook })
            }

        } catch (error) {
            return res.status(500).send({ success: false, error: 'Internal server error' })
        }
    })

router.get('/?name=:name', fetchadmin, fetchmanager, fetchuser,
    [
        param('name', 'Please enter the name with length 5').isLength({ min: 5 }).custom(value => {
            if (!symbols.bookName(value)) {
                return Promise.reject('Enter valid name');
            }
            return true
        }),
    ],
    async (req, res) => {
        if (!validationResult(req).isEmpty()) {
            return res.status(400).json({ errors: validationResult(req).array() })
        }
        let finaluser = null
        if (req.admin) {
            adminId = req.admin.id;
            finaluser = await Admin.findById(adminId)
        }
        else {
            if (req.manager) {
                managerId = req.manager.id;
                finaluser = await Manager.findById(managerId)
            }
            if (req.user) {
                userId = req.user.id;
                finaluser = await User.findById(userId)
            }
        }
        if (!req.admin && !req.user && !req.manager) {
            return res.status(401).send({ success: false, error: 'please login' })
        }
        if (!finaluser) {
            return res.status(401).send({ success: false, error: 'please signup' })
        }
        try {
            if (!subjectBook) {
                return res.status(401).send({ success: false, error: 'No book found' })
            }
            else {
                return res.send({ success: true, subjectBook })
            }

        } catch (error) {
            return res.status(500).send({ success: false, error: 'Internal server error' })
        }
    })

// Api for BrancWise Search


router.get('/:branch', fetchadmin, fetchmanager, fetchuser,
    [
        param('branch', 'Please enter the valid branch').isAlpha(),
    ],
    async (req, res) => {
        if (!validationResult(req).isEmpty()) {
            return res.status(400).json({ errors: validationResult(req).array() })
        }
        let finaluser = null
        if (req.admin) {
            adminId = req.admin.id;
            finaluser = await Admin.findById(adminId)
        }
        else {
            if (req.manager) {
                managerId = req.manager.id;
                finaluser = await Manager.findById(managerId)
            }
            if (req.user) {
                userId = req.user.id;
                finaluser = await User.findById(userId)
            }
        }
        if (!req.admin && !req.user && !req.manager) {
            return res.status(401).send({ success: false, error: 'please login' })
        }
        if (!finaluser) {
            return res.status(401).send({ success: false, error: 'please signup' })
        }
        try {
            let branchBook = await Books.find({ branch: req.params.branch.toUpperCase() })
            if (!branchBook) {
                return res.status(401).send({ success: false, error: 'No book found' })
            }
            else {
                return res.send({ success: true, branchBook })
            }

        } catch (error) {
            return res.status(500).send({ success: false, error: 'Internal server error' })
        }
    })


// Api for subjectWise searching


router.get('/:branch/:subject', fetchadmin, fetchmanager, fetchuser,
    [
        param('branch', 'Please enter the valid branch').isAlpha(),
        param('subject', 'Please enter the subject').isLength({ min: 5 }).custom(value => {
            if (!symbols.subject(value)) {
                return Promise.reject('enter the valid subject name')
            }
            return true
        })
    ],
    async (req, res) => {
        if (!validationResult(req).isEmpty()) {
            return res.status(400).json({ errors: validationResult(req).array() })
        }
        let finaluser = null
        if (req.admin) {
            adminId = req.admin.id;
            finaluser = await Admin.findById(adminId)
        }
        else {
            if (req.manager) {
                managerId = req.manager.id;
                finaluser = await Manager.findById(managerId)
            }
            if (req.user) {
                userId = req.user.id;
                finaluser = await User.findById(userId)
            }
        }
        if (!req.admin && !req.user && !req.manager) {
            return res.status(401).send({ success: false, error: 'please login' })
        }
        if (!finaluser) {
            return res.status(401).send({ success: false, error: 'please signup' })
        }
        try {
            let subjectBook = await Books.find({ branch: req.params.branch.toUpperCase(), subject: req.params.subject.toUpperCase() })
            if (!subjectBook) {
                return res.status(401).send({ success: false, error: 'No book found' })
            }
            else {
                return res.send({ success: true, subjectBook })
            }

        } catch (error) {
            return res.status(500).send({ success: false, error: 'Internal server error' })
        }
    })


module.exports = router