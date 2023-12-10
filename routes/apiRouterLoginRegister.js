// Route handlers
const express = require('express');
const router = express.Router()

const Customer = require('../models/Customer');
const Cart = require('../models/Cart');

router.get('/', async (req, res) => {
    res.render("login-register.ejs");
});

router.post('/', async (req, res) => {
    const data = req.body;

    if (data.buttonname === 'button-login') {
        const { username, password } = data;
        try {
            const customer = await Customer.findOne({ customer_name: username});
            if (!customer){
                return res.json({ code: 404, message: 'login_fail_no_user' });
            }
        
            if (customer.customer_password === password) {
                res.cookie('username', username);
                res.cookie('userid', customer._id);
                // create an empty cart
                const cart = await Cart.findOne({customer_id:customer._id});
                if(!cart){
                    console.log('Empty cart created.')
                    const newCart = new Cart({
                        customer_id: customer._id,
                        total_price: 0
                    });
                    await newCart.save().catch(err => console.error(err));
                }
                return res.json({ code: 200, message: 'login_success' });
            } else {
                return res.json({ code: 401, message: 'login_fail' });
            }
        } catch (error) {
            console.error(error);
            return res.json({ code: 500, message: 'An error occurred during login' });
        }
        
    } else if (data.buttonname === 'button-register') {
        const { username, usertype, email, password } = data;
        try {
            const newCustomer = new Customer({
                customer_name: username,
                customer_password: password,
                customer_email: email,
                kind: usertype
            });
            await newCustomer.save();
            res.json({ code: 200, message: 'Registration successful' });
        } catch (error) {
            if (error.code === 11000) {
                // Handle MongoDB duplicate key error
                const field = Object.keys(error.keyPattern)[0];
                const code = field === 'customer_name' ? 501 : 502;
                const message = field === 'customer_name' ? 'customer_name duplicate' : 'customer_email duplicate';
                res.json({ code, message });
            } else {
                console.error(error);
                res.status(500).send('An error occurred during registration');
            }
        }
    } else {
        res.json({ code: 400, message: 'Submit button redirection error' });
    }
});

module.exports = router;