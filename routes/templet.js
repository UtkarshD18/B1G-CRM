const router = require('express').Router()
const { query } = require('../database/dbpromise.js')
const randomstring = require('randomstring')
const bcrypt = require('bcrypt')
const { isValidEmail, getFileExtension } = require('../functions/function.js')
const { sign } = require('jsonwebtoken')
const validateUser = require('../middlewares/user.js')
const { checkPlan } = require('../middlewares/plan.js')

// add templet 
router.post('/add_new', validateUser, checkPlan, async (req, res) => {
    try {
        const { title, type, content } = req.body

        if (!title || !type || !content) {
            return res.json({ success: false, msg: "Please give a title" })
        }

        await query(`INSERT INTO templets (uid, content, type, title) VALUES (?,?,?,?)`, [
            req.decode.uid,
            JSON.stringify(content),
            type,
            title
        ])

        res.json({ success: true, msg: "Templet was added" })

    } catch (err) {
        console.log(err)
        res.json({ err, msg: "something went wrong", success: false })
    }
})

// get my templet 
router.get('/get_templets', validateUser, async (req, res) => {
    try {
        const data = await query(`SELECT * FROM templets WHERE uid = ?`, [req.decode.uid])
        res.json({ data, success: true })

    } catch (err) {
        console.log(err)
        res.json({ err, msg: "something went wrong", success: false })
    }
})

// dele templets  
router.post('/del_templets', validateUser, async (req, res) => {
    try {

        await query(`DELETE FROM templets WHERE id IN (?) AND uid = ?`, [req.body.selected, req.decode.uid])
        res.json({ success: true, msg: "Template(s) was deleted" })

    } catch (err) {
        res.json({ success: false, msg: "something went wrong" })
        console.log(err)
    }
})

// update templet
router.post('/update', validateUser, async (req, res) => {
    try {
        const { id, title, type, content } = req.body

        if (!id || !title || !type || !content) {
            return res.json({ success: false, msg: "Missing required fields" })
        }

        // Verify ownership
        const [existing] = await query(`SELECT * FROM templets WHERE id = ? AND uid = ?`, [id, req.decode.uid])
        if (!existing) {
            return res.json({ success: false, msg: "Template not found" })
        }

        await query(`UPDATE templets SET title = ?, type = ?, content = ? WHERE id = ? AND uid = ?`, [
            title,
            type,
            JSON.stringify(content),
            id,
            req.decode.uid
        ])

        res.json({ success: true, msg: "Template was updated" })

    } catch (err) {
        console.log(err)
        res.json({ err, msg: "something went wrong", success: false })
    }
})

module.exports = router