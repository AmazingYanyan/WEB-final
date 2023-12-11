// Route handlers
const express = require('express');
const router = express.Router()

const Manager = require('../models/Manager');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const OrdersProduct = require('../models/OrdersProduct');
const session = require('express-session');

function formatArrivingDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString('en-US', options);
}

function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(date).toLocaleDateString('en-US', options);
}

router.get('/', async (req, res) => {
    let username = req.query.username || req.session.manager_name;

    if (username && username.length > 0) {
        try {
            const manager = await Manager.findOne({ manager_name: username });
            if (manager) {
                const customers = await Customer.find();

                const products = await Product.find().sort({ _id: 1 });
                const imgList = products.map(product => ({
                    product_id: product._id,
                    images: product.product_image.split(',')
                }));

                for (const customer of customers) {
                    const orders = await Order.find({ customer_id: customer._id }).sort({ createdAt: -1 });
                    customer.last_order = orders.length > 0 ? formatArrivingDate(orders[0].createdAt) : 'Not Available';
                    customer.total_orders = orders.length;
                    customer.total_expense = orders.reduce((sum, order) => sum + order.total_price, 0);
                }

                const orders = await Order.find({ manager_id: manager._id }).populate('address_id');
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
                            tag: productRows === 0 ? 1 : 0
                        };
                        orderList.push(orderProductData);
                        productRows++;
                    }
                    productRowsList.push(productRows);
                }

                let i = -1;
                for (let item of orderList) {
                    if (item.tag === 1) {
                        i++;
                    }
                    item.product_rows = productRowsList[i];
                    item.formatcreatedAt = formatDate(item.createdAt);
                    item.address = item.address_id.street + ', ' + item.address_id.city + ', ' + item.address_id.state + ', ' + +item.address_id.zipcode;
                }

                res.render("management", {
                    item_list: products,
                    img_list: imgList,
                    username: username,
                    customer_list: customers,
                    order_list: orderList
                });
            } else {
                res.status(404).send("Manager Not Found");
            }
        } catch (error) {
            console.error(error);
            res.status(500).send("Internal Server Error");
        }
    } else {
        res.status(500).send("Please log-in your manager account first.");
    }
});



router.get('/refresh', async (req, res) => {
    const data = req.query;
    if (data.request_type === 'update_products') {
        try {
            const products = await Product.find().sort({ _id: 1 });
            const imgList = products.map(product => ({
                product_id: product._id,
                images: product.product_image.split(',')
            }));
            res.json({
                code: 200,
                message: '',
                product_id: products,
                img_list: imgList
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ code: 500, message: 'error' });
        }
    } else {
        res.status(400).json({ code: 400, message: 'Invalid request type' });
    }
});


router.put('/resale', async (req, res) => {
    const data = req.body;

    if (data.request_type === 'sql_resale_product') {
        const productId = data.product_id;
        try {
            const updateResult = await Product.updateOne(
                { _id: productId },
                { $set: { is_sale: true } }
            );

            if (updateResult.modifiedCount === 0) {
                return res.status(404).json({ code: 404, message: 'Product not found' });
            }

            res.json({ code: 200, message: '' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ code: 500, message: 'SQL Update fails' });
        }
    } else {
        res.status(400).json({ code: 400, message: 'Invalid request type' });
    }
});

router.put('/delete', async (req, res) => {
    const data = req.body;

    if (data.request_type === 'sql_delete_product') {
        const productId = data.product_id;
        try {
            const updateResult = await Product.updateOne(
                { _id: productId },
                { $set: { is_sale: false } }
            );

            if (updateResult.modifiedCount === 0) {
                return res.status(404).json({ code: 404, message: 'Product not found' });
            }

            res.json({ code: 200, message: '' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ code: 500, message: 'SQL Update fails' });
        }
    } else {
        res.status(400).json({ code: 400, message: 'Invalid request type' });
    }
});

router.post('/newproduct', async (req, res) => {
    const data = req.body;

    if (data.request_type === 'sql_add_product') {
        try {
            // Remove request_type from data as it's not part of the Product model
            delete data.request_type;

            // If sale_price is provided, set original_price to the same value
            if (data.sale_price) {
                data.original_price = data.sale_price;
            }

            // Assuming store_id is provided or set to a default value
            data.store_id = data.store_id || 1;

            // Create a new product
            const newProduct = new Product(data);
            await newProduct.save();

            res.json({ code: 200, message: '' });
        } catch (error) {
            if (error.name === 'MongoError' && error.code === 11000) {
                // Handle duplicate key error
                res.status(501).json({ code: 501, message: 'Integrity Error' });
            } else {
                console.error(error);
                res.status(500).json({ code: 500, message: 'Create a new product fails' });
            }
        }
    } else {
        res.status(400).json({ code: 400, message: 'Invalid request type' });
    }
});

router.post('/newmanager', async (req, res) => {
    const data = req.body;

    
        try {
            const duplicate_manager = await Manager.findOne({manager_name:data.manager_name});
            if(duplicate_manager){
                return res.status(501).json({ code: 500, message: 'Dulplicate Managers' });
            }
            const newManager = new Manager(data);
            await newManager.save();

            res.json({ code: 200, message: 'success' });
        } catch (error) {
            if (error.name === 'MongoError' && error.code === 11000) {
                res.status(501).json({ code: 501, message: 'Integrity Error' });
            } else {
                console.error(error);
                res.status(500).json({ code: 500, message: 'Create a new product fails' });
            }
        }
});

router.put('/editproduct', async (req, res) => {
    const data = req.body;
    console.log(data)
    if (data.request_type === 'sql_alter_product') {
        const productId = data.product_id;
        delete data.request_type;
        delete data.product_id;

        try {
            const updateResult = await Product.updateOne(
                { _id: productId },
                { $set: data }
            );

            if (updateResult.modifiedCount === 0) {
                return res.status(404).json({ code: 404, message: 'Product not found' });
            }

            res.json({ code: 200, message: '' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ code: 500, message: 'SQL Update fails' });
        }
    } else {
        res.status(400).json({ code: 400, message: 'Invalid request type' });
    }
});

router.put('/customer-edit', async (req, res) => {
    try {
        const data = req.body;
        if (data.request_type === 'sql_alter_customer') {
            const customerId = data.customer_id;
            const updateData = {};

            if (data.customer_email) {
                updateData.customer_email = data.customer_email;
            }
            if (data.customer_password) {
                updateData.customer_password = data.customer_password;
            }

            await Customer.findByIdAndUpdate(customerId, updateData);

            res.json({ code: 200, message: 'Customer info updated successfully' });
        } else {
            res.status(400).json({ code: 400, message: 'Invalid request type' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 500, message: 'Internal Server Error' });
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

router.get('/plot', async (req, res) => {
    const data = req.query;
    const manager_name = data.manager_name || req.session.manager_name;
    if (manager_name) {
        const manager = await Manager.findOne({ manager_name: manager_name });
        try {
            const orderProducts = await OrdersProduct.aggregate([
                {
                    $group: {
                        _id: "$product_id",
                        totalQuantity: { $sum: "$quantity" }
                    }
                },
                { $sort: { totalQuantity: -1 } },
                { $limit: 5 }
            ]).exec();

            const topProductsData = await Promise.all(orderProducts.map(async (op) => {
                const product = await Product.findById(op._id);
                return {
                    productName: product.product_name,
                    totalQuantity: op.totalQuantity
                };
            }));

            res.json({ code: 200, topProductsData: topProductsData });
        } catch (error) {
            console.error(error);
            res.status(500).json({ code: 500, message: 'Internal Server Error' });
        }

    } else {
        res.status(404).json({ code: 404, message: 'Manager Not Found' });
    }
});

module.exports = router;