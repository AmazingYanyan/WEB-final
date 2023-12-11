// Route handlers
const express = require('express');
const router = express.Router()

const Salesperson = require('../models/Salesperson');
const Manager = require('../models/Manager');
const session = require('express-session');

router.get('/', async (req, res) => {
    let data = req.query;
    if(data && data.request_type== 'log-out'){
        req.session.destroy((err) => {
            if (err) {
                console.error("Error destroying session:", err);
                res.status(500).send("Internal Server Error");
            }else{
                res.json({ code: 200, message: 'log out' });
            }
        });
    }else{
        res.render("login-manager");
    }
});

router.post('/', async (req, res) => {
    const { usertype, username, password } = req.body;

    try {
        let user = await Manager.findOne({ manager_name: username });

        if (user) {
            if(user.manager_password == password){
                req.session.manager_name = username;
                req.session.manager_id = user._id;
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