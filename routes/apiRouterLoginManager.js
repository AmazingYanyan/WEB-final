// Route handlers
const express = require('express');
const router = express.Router()

const Salesperson = require('../models/Salesperson');
const Manager = require('../models/Manager');

router.get('/', async (req, res) => {
    res.render("login-manager.ejs");
});

router.post('/', async (req, res) => {
    const { usertype, username, password } = req.body;

    try {
        let user = await Manager.findOne({ manager_name: username });

        if (user) {
            if(user.manager_password == password){
                res.json({ code: 200, message: 'login_success' });
            }else{
                res.json({ code: 401, message: 'login_fail' });
            }
        } else {
            res.json({ code: 404, message: 'login_fail_no_user' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
});

module.exports = router;