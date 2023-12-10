const express = require('express');
const router = express.Router();

const Customer = require('../models/Customer');
const Address = require('../models/Address');

router.get('/', async (req, res) => {
    let customer_name = req.query.username || req.cookies.username;
    res.render("add-address", { customer_name: customer_name });
});

router.post('/create-address', async (req, res) => {
    const data = req.body;
    if (data.request_type === 'add_address') {
        const { address_customer_name, country, street, apartment, city, state, zipcode, phone } = data;

        let formattedPhone = phone.replace(/[()\- ]/g, '');
        let formattedStreet = `${street} ${apartment}`;

        try {
            const customer = await Customer.findOne({ customer_name: req.cookies.username });
            if (customer) {
                const newAddress = new Address({
                    customer_id: customer._id,
                    street: formattedStreet,
                    city: city,
                    state: state,
                    zipcode: zipcode
                });
                await newAddress.save();
                res.status(200).json({ code: 200, message: '' });
            } else {
                res.status(400).json({ code: 400, message: 'Customer not found' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ code: 500, message: 'SQL insert fails' });
        }
    } else {
        res.status(400).send('Invalid request');
    }
});

module.exports = router;
