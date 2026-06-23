const router = require('express').Router()
const { query, withTransaction } = require('../database/dbpromise.js')
const randomstring = require('randomstring')
const bcrypt = require('bcrypt')
const { isValidEmail, areMobileNumbersFilled } = require('../functions/function.js')
const { sign } = require('jsonwebtoken')
const { validateUserOrAgent, verifyPermission } = require('../middlewares/auth.js')
const csv = require('csv-parser');
const fs = require('fs');
const { checkPlan, checkContactLimit } = require('../middlewares/plan.js')

// add phonebook name 
router.post('/add', validateUserOrAgent, verifyPermission('contacts_access'), checkPlan, checkContactLimit, async (req, res) => {
    try {
        const { name } = req.body

        if (!name) {
            return res.json({ success: false, msg: "Please enter a phonebook name" })
        }

        // find ext 
        const findExt = await query(`SELECT * FROM phonebook WHERE uid = ? AND name = ?`, [req.decode.uid, name])

        if (findExt.length > 0) {
            return res.json({ success: false, msg: "Duplicate phonebook name found" })
        }

        const insertRes = await query(`INSERT INTO phonebook (name, uid) VALUES (?,?) RETURNING *`, [name, req.decode.uid])
        res.json({ success: true, msg: "Phonebook was added", data: insertRes[0] })

    } catch (err) {
        res.json({ success: false, msg: "something went wrong" })
        console.log(err)
    }
})

// get by uid 
router.get('/get_by_uid', validateUserOrAgent, verifyPermission('contacts_access'), async (req, res) => {
    try {
        const data = await query(`
            SELECT phonebook.*, COUNT(contact.id)::int AS contact_count
            FROM phonebook
            LEFT JOIN contact
                ON contact.phonebook_id = phonebook.id
                AND contact.uid = phonebook.uid
            WHERE phonebook.uid = ?
            GROUP BY phonebook.id
            ORDER BY phonebook.created_at DESC
        `, [req.decode.uid])
        res.json({ data, success: true })
    } catch (err) {
        res.json({ success: false, msg: "something went wrong" })
        console.log(err)
    }
})

// del a phonebook 
router.post('/del_phonebook', validateUserOrAgent, verifyPermission('contacts_access'), async (req, res) => {
    try {
        const { id } = req.body

        await withTransaction(async (tx) => {
            await tx(`DELETE FROM phonebook WHERE id = ? AND uid = ?`, [id, req.decode.uid])
            await tx(`DELETE FROM contact WHERE phonebook_id = ? AND uid = ?`, [id, req.decode.uid])
        })

        res.json({ success: true, msg: "Phonebook was deleted" })

    } catch (err) {
        res.json({ success: false, msg: "something went wrong" })
        console.log(err)
    }
})


function parseCSVFile(fileData) {
    return new Promise((resolve, reject) => {
        const results = [];

        // Check if file data is provided
        if (!fileData) {
            resolve(null);
            return;
        }

        const stream = require('stream');
        const bufferStream = new stream.PassThrough();

        // Convert file data (Buffer) to a readable stream
        bufferStream.end(fileData);

        // Use csv-parser to parse the CSV data
        bufferStream.pipe(csv())
            .on('data', (data) => {
                // Push each row of data to the results array
                results.push(data);
            })
            .on('end', () => {
                // Resolve the promise with the parsed CSV data
                resolve(results);
            })
            .on('error', (error) => {
                // Reject the promise if there is an error
                resolve(null);
            });
    });
}


router.post('/import_contacts', validateUserOrAgent, verifyPermission('contacts_access'), checkPlan, checkContactLimit, async (req, res) => {
    try {
        const { id, phonebook_name } = req.body

        if (!id) {
            return res.json({ success: false, msg: "Phonebook ID is required" })
        }

        // Verify phonebook ownership
        const pbCheck = await query(`SELECT id FROM phonebook WHERE id = ? AND uid = ?`, [id, req.decode.uid]);
        if (pbCheck.length < 1) {
            return res.json({ success: false, msg: "Phonebook not found or unauthorized" })
        }

        if (!req.files || Object.keys(req.files).length === 0) {
            return res.json({ success: false, msg: "No files were uploaded" })
        }

        const csvData = await parseCSVFile(req.files.file.data);
        if (!csvData) {
            return res.json({ success: false, msg: "Invalid CSV provided" })
        }

        const cvalidateMobile = areMobileNumbersFilled(csvData)
        if (!cvalidateMobile) {
            return res.json({ msg: "Please check your CSV there one or more mobile not filled", csvData })
        }

        // Flatten the array of objects into an array of values
        const values = csvData.map(item => [
            req.decode.uid,  // assuming uid is available in each item
            id,
            phonebook_name,
            item.name,
            item.mobile,
            item.var1,
            item.var2,
            item.var3,
            item.var4,
            item.var5
        ]);

        // Execute the query
        await query(`INSERT INTO contact (uid, phonebook_id, phonebook_name, name, mobile, var1, var2, var3, var4, var5) VALUES ?`, [values]);

        res.json({ success: true, msg: "Contacts were inserted" });

    } catch (err) {
        res.json({ success: false, msg: "something went wrong" })
        console.log(err)
    }
})

// add single contact 
router.post('/add_single_contact', validateUserOrAgent, verifyPermission('contacts_access'), checkPlan, checkContactLimit, async (req, res) => {
    try {
        const { id, phonebook_name, mobile, name, var1, var2, var3, var4, var5 } = req.body

        if (!id) {
            return res.json({ success: false, msg: "Phonebook ID is required" })
        }

        if (!mobile) {
            return res.json({ success: false, msg: "Mobile number is required" })
        }

        // Verify phonebook ownership
        const pbCheck = await query(`SELECT id FROM phonebook WHERE id = ? AND uid = ?`, [id, req.decode.uid]);
        if (pbCheck.length < 1) {
            return res.json({ success: false, msg: "Phonebook not found or unauthorized" })
        }

        await query(`INSERT INTO contact (uid, phonebook_id, phonebook_name, name, mobile, var1, var2, var3, var4, var5) VALUES (?,?,?,?,?,?,?,?,?,?)`, [
            req.decode.uid,
            id,
            phonebook_name,
            name,
            mobile,
            var1,
            var2,
            var3,
            var4,
            var5
        ])

        res.json({ success: true, msg: "Contact was inserted" });

    } catch (err) {
        res.json({ success: false, msg: "something went wrong" })
        console.log(err)
    }
})

// get contacts using uid 
router.get('/get_uid_contacts', validateUserOrAgent, verifyPermission('contacts_access'), async (req, res) => {
    try {
        const data = await query(`SELECT * FROM contact WHERE uid = ?`, [req.decode.uid])
        res.json({ data, success: true })

    } catch (err) {
        res.json({ success: false, msg: "something went wrong" })
        console.log(err)
    }
})


// dele contcats 
router.post('/del_contacts', validateUserOrAgent, verifyPermission('contacts_access'), async (req, res) => {
    try {

        await query(`DELETE FROM contact WHERE id IN (?) AND uid = ?`, [req.body.selected, req.decode.uid])
        res.json({ success: true, msg: "Contact(s) was deleted" })

    } catch (err) {
        res.json({ success: false, msg: "something went wrong" })
        console.log(err)
    }
})

// rename phonebook
router.post('/update', validateUserOrAgent, verifyPermission('contacts_access'), async (req, res) => {
    try {
        const { id, name } = req.body

        if (!id || !name) {
            return res.json({ success: false, msg: "Phonebook ID and name are required" })
        }

        // Verify ownership first
        const pbExists = await query(`SELECT * FROM phonebook WHERE id = ? AND uid = ?`, [id, req.decode.uid])
        if (pbExists.length < 1) {
            return res.json({ success: false, msg: "Phonebook not found" })
        }

        // Check for duplicate name
        const findExt = await query(`SELECT * FROM phonebook WHERE uid = ? AND name = ? AND id != ?`, [req.decode.uid, name, id])
        if (findExt.length > 0) {
            return res.json({ success: false, msg: "Duplicate phonebook name found" })
        }

        await query(`UPDATE phonebook SET name = ? WHERE id = ? AND uid = ?`, [name, id, req.decode.uid])
        await query(`UPDATE contact SET phonebook_name = ? WHERE phonebook_id = ? AND uid = ?`, [name, id, req.decode.uid])

        res.json({ success: true, msg: "Phonebook was updated" })
    } catch (err) {
        res.json({ success: false, msg: "something went wrong" })
        console.log(err)
    }
})

// edit contact
router.post('/update_contact', validateUserOrAgent, verifyPermission('contacts_access'), async (req, res) => {
    try {
        const { id, name, mobile, var1, var2, var3, var4, var5 } = req.body

        if (!id || !mobile) {
            return res.json({ success: false, msg: "Contact ID and mobile are required" })
        }

        // Verify ownership
        const contactExists = await query(`SELECT * FROM contact WHERE id = ? AND uid = ?`, [id, req.decode.uid])
        if (contactExists.length < 1) {
            return res.json({ success: false, msg: "Contact not found" })
        }

        await query(
            `UPDATE contact 
             SET name = ?, mobile = ?, var1 = ?, var2 = ?, var3 = ?, var4 = ?, var5 = ?
             WHERE id = ? AND uid = ?`,
            [
                name || '',
                mobile,
                var1 || '',
                var2 || '',
                var3 || '',
                var4 || '',
                var5 || '',
                id,
                req.decode.uid
            ]
        )

        res.json({ success: true, msg: "Contact was updated" })
    } catch (err) {
        res.json({ success: false, msg: "something went wrong" })
        console.log(err)
    }
})

module.exports = router
