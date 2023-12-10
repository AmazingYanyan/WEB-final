// Route handlers
const express = require('express');
const router = express.Router()

//import data models


router.get('/', async (req, res) => {
    let username = req.cookies.username;
    if (!username) {
        username = req.query.username;
        if (username) {
            res.cookie('username', username);
        }
    }
    res.render("homepage.ejs");
});

router.post('/', async (req, res) => {
    const username = req.body.user;
    // ...
});

module.exports = router;