const express = require('express');
const router = express.Router();

const Order = require('../models/Order');
const OrdersProduct = require('../models/OrdersProduct');
const Product = require('../models/Product');


router.get('/', async (req, res) => {
    let username = req.query.username || req.cookies.username;

    if (username && username.length > 0) {
        try {
            const orders = await Order.find({ manager_id: manager._id });

            let orderList = [];
            let productRowsList = [];
            for (let order of orders) {
                const orderProducts = await OrdersProduct.find({ order_id: order._id }).populate('product_id');
                let productRows = 0;
                for (let op of orderProducts) {
                    let orderProductData = {
                        ...order.toJSON(),
                        ...op.toJSON(),
                        product_name: op.product_id.product_name,
                        product_type: op.product_id.product_type,
                        sale_price: op.product_id.sale_price,
                        quantity: op.quantity,
                        tag: productRows === 0 ? 1 : 0 // tag 设置
                    };
                    orderList.push(orderProductData);
                    productRows++;
                }
                productRowsList.push(productRows);
            }

            // 为 orderList 中的每个项目设置 product_rows
            let i = -1;
            for (let item of orderList) {
                if (item.tag === 1) {
                    i++;
                }
                item.product_rows = productRowsList[i];
            }

            res.render("order_management", {
                order_list: orderList,
            });
        } catch (error) {
            console.error(error);
            res.status(500).send("Internal Server Error");
        }
    } else {
        rres.status(500).send("Please log-in your manager account first.");
    }
});


router.put('/update-order', async (req, res) => {
    const data = req.body;
    if (data.request_type === 'order_shipped') {
        const orderId = data.order_id;
        try {
            await Order.updateOne({ _id: orderId }, { order_status: 'shipped' });
            res.json({ code: 200, message: '' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ code: 500, message: 'SQL update fails' });
        }
    } else if (data.request_type === 'order_canceled') {
        const orderId = data.order_id;
        try {
            await Order.updateOne({ _id: orderId }, { order_status: 'canceled' });
            res.json({ code: 200, message: '' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ code: 500, message: 'SQL update fails' });
        }
    } else {
        res.status(400).json({ code: 400, message: 'Invalid request type' });
    }
});


module.exports = router;
