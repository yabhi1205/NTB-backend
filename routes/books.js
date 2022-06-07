const express = require('express')
const router = express.Router()
const { body, validationResult, param, oneOf } = require('express-validator');
const fetchadmin = require('../middlewares/verifyadmin')
const fetchmanager = require('../middlewares/verifymanager')
const fetchuser = require('../middlewares/verifyuser')
const symbols = require('../validator/symbols')
const Books = require('../modals/Books')
const User = require('../modals/User')
const Admin = require('../modals/Admin')
const Manager = require('../modals/Manager');
// const { promise } = require('bcrypt/promises');


//   Api for adding the boooks


router.post('/add', fetchadmin, fetchmanager,
    [
        body('name', 'Please enter the name with length 5').isLength({ min: 5 }).custom(value => {
            if (!symbols.bookName(value)) {
                return Promise.reject('Enter valid name');
            }
            return true
        }),
        body("author", 'Please enter the valid name for Author').isLength({ min: 5 }).custom(value => {
            if (!symbols.name(value)) {
                return Promise.reject('Enter the valid name')
            }
            return true
        }),
        body('bookId', 'Please enter the valid bookId').not().isString(),
        body('branch', 'Please enter the valid branch').isAlpha().isLength({ min: 3 }),
        body('subject', 'Please enter the valid subject').isLength({ min: 5 }).custom(value => {
            if (!symbols.subject(value)) {
                return Promise.reject('enter the valid subject name')
            }
            return true
        })
    ],
    async (req, res) => {
        if (!validationResult(req).isEmpty()) {
            return res.status(400).json({ success: false, errors: validationResult(req).array() })
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
        }
        if (!req.admin && !req.manager) {
            return res.status(401).send({ success: false, error: 'please login' })
        }
        if (!finaluser) {
            return res.status(401).send({ success: false, error: 'please signup' })
        }
        let book = Books(req.body)
        try {
            book = await Books.findOne({ bookId: req.body.bookId })
            if (book) {
                return res.status(409).send({ success: false, error: "Already bookId exists" })
            }
            book = await Books.create({
                name: req.body.name.toUpperCase(),
                author: req.body.author.toUpperCase(),
                bookId: req.body.bookId,
                branch: req.body.branch.toUpperCase(),
                subject: req.body.subject.toUpperCase()
            })
            if (!book) {
                return res.status(401).send({ success: false, error: 'Book not created' })
            }
            else {
                return res.send({ success: true, book })
            }
        } catch (error) {
            return res.status(404).send({ success: false, error: "internal error" })
        }
    })


//       Api for editing the content of the books


router.post('/edited/:id', fetchadmin, fetchmanager,
    [
        body('name').custom(value => {
            if (value && !symbols.bookName(value)) {
                return Promise.reject('Enter valid name');
            }
            return true
        }),
        body("author", 'Please enter the valid name for Author').custom(value => {
            if (value && !symbols.name(value)) {
                return Promise.reject('Enter the valid name')
            }
            return true
        }),
        body('branch', 'Please enter the valid branch').isAlpha(),
        body('subject', 'Please enter the valid subject').custom(value => {
            if (value && !symbols.subject(value)) {
                return Promise.reject('enter the valid subject name')
            }
            return true
        })
    ],
    async (req, res) => {
        if (!validationResult(req).isEmpty()) {
            return res.status(400).json({ success: false, errors: validationResult(req).array() })
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
            if (!req.admin && !req.manager) {
                return res.status(401).send({ success: false, error: 'please login' })
            }
            if (!finaluser) {
                return res.status(401).send({ success: false, error: 'please signup' })
            }
        }
        try {
            let book = await Books.findById(req.params.id)
            if (!book) {
                return res.status(400).send({ success: false, error: 'book doesnot exists' })
            }
            const newBook = {}
            if (req.body.name) { newBook.name = req.body.name.toUpperCase() }
            if (req.body.author) { newBook.author = req.body.author.toUpperCase() }
            if (req.body.branch) { newBook.branch = req.body.branch.toUpperCase() }
            if (req.body.subject) { newBook.subject = req.body.subject.toUpperCase() }
            let data = await Books.findByIdAndUpdate(req.params.id, { $set: newBook }, { new: true })
            if (!data) {
                return res.status(401).send({ success: false, error: 'Book not updated' })
            }
            else {
                return res.send({ success: true, data })
            }
        } catch (error) {
            return res.status(500).send({ success: false, error: 'Internal server error' })
        }
    })

//  Api for Deleting the Book


router.delete('/delete/:id', fetchadmin, fetchmanager, async (req, res) => {
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
        if (!req.admin && !req.manager) {
            return res.status(401).send({ success: false, error: 'please login' })
        }
        if (!finaluser) {
            return res.status(401).send({ success: false, error: 'please signup' })
        }
    }
    try {
        let book = await Books.findById(req.params.id)
        if (!book) {
            return res.status(400).send({ success: false, error: "book doesn't exists" })
        }
        book = await Books.findByIdAndDelete(req.params.id)
        if (!book) {
            return res.status(400).send({ success: false, error: 'Book Deletion Unsuccessfully' })
        }
        else {
            return res.send({ success: true, book })
        }
    } catch (error) {
        return res.status(500).send({ success: false, error: 'Internal server error' })
    }
})
module.exports = router