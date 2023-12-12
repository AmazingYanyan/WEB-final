// Route handlers
const express = require('express');
const router = express.Router()

//import data models
const Customer = require("../models/Customer");
const Order = require("../models/Order");
const Product = require("../models/Product");
const OrdersProduct = require('../models/OrdersProduct');

function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' };
    return new Date(date).toLocaleDateString('en-US', options);
}

function formatArrivingDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString('en-US', options);
}

router.get('/', async (req, res) => {
    let username = req.query.username || req.cookies.username;

    if (username && username.length > 0) {
        res.cookie('username', username);

        try {
            const customer = await Customer.findOne({ customer_name: username });
            if (customer) {
                const orders = await Order.find({ customer_id: customer._id }).populate('customer_id');

                for (let order of orders) {
                    const orderProducts = await OrdersProduct.find({ order_id: order._id }).populate('product_id');
                    order.product_list = await Promise.all(orderProducts.map(async (op) => {
                        const product = await Product.findById(op.product_id);
                        return {
                            product_id: product._id,
                            product_name: product.product_name,
                            product_image: product.product_image.split(',')[0]
                        };
                    }));
                    order.customer_name = customer.customer_name;
                    order.formattedCreatedAt = formatDate(order.createdAt);
                    order.formattedArrivingAt = formatArrivingDate(order.createdAt);
                }

                res.render("order", { item_list: orders });
            } else {
                res.render("order", { item_list: [] });
            }
        } catch (error) {
            console.error(error);
            res.status(500).send("Internal Server Error");
        }
    } else {
        res.status(400).send("Please log in first");
    }
});

router.put('/return-order', async (req, res) => {
    const data = req.body;
    console.log(data)
    if (data && data.request_type === 'return_order') {
        const orderId = data.order_id;
        try {
            await Order.updateOne({ _id: orderId }, { order_status: 'returning' });
            res.status(200).json({ code: 200, message: '' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ code: 500, message: 'Update fails' });
        }
    } else {
        res.status(400).json({ code: 400, message: 'Invalid request' });
    }
});

router.delete('/delete-order', async (req, res) => {
    const { order_id, product_id_list } = req.body;

    if (!order_id) {
        return res.status(400).json({ code: 400, message: 'Order ID is required' });
    }

    try {
        await Order.deleteOne({ _id: order_id });

        if (product_id_list && product_id_list.length) {
            await OrdersProduct.deleteMany({
                order_id: order_id,
                product_id: { $in: product_id_list }
            });
        }

        res.json({ code: 200, message: 'Order and associated products deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 500, message: 'Internal Server Error' });
    }
});

module.exports = router;