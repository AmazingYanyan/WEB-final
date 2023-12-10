const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');


const Customer = require('../models/Customer');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');
const OrdersProduct = require('../models/OrdersProduct');
const CartProduct = require('../models/CartProduct');
const Address = require('../models/Address');
const Store = require("../models/Store");
const Manager = require('../models/Manager');

router.get('/', async (req, res) => {
    let username = req.query.username || req.cookies.username;
    let idList = req.query['id_list'];

    if (username && username.length > 0) {
        try {
            const customer = await Customer.findOne({ customer_name: username });
            // console.log(Array.isArray(idList));
            if (customer && idList) {
                const cart = await Cart.findOne({ customer_id: customer._id });
                const cartProducts = await CartProduct.find({
                    cart_id: cart._id,
                    product_id: { $in: idList }
                }).populate('product_id');

                let productResult = [];
                let cartSubtotal = 0;
                let cartSubtotalOriginal = 0;
                cartProducts.forEach(cp => {
                    let product = cp.product_id;
                    let cartImage = product.product_image.split(',')[0];
                    let totalProductPrice = cp.quantity * product.sale_price;
                    let origin_totalProductPrice = cp.quantity * product.original_price;
                    totalProductPrice = Math.round(totalProductPrice * 100) / 100;
                    origin_totalProductPrice = Math.round(origin_totalProductPrice * 100) / 100;
                    cartSubtotal += totalProductPrice;
                    cartSubtotalOriginal += origin_totalProductPrice
                    productResult.push({
                        ...product.toJSON(),
                        quantity: cp.quantity,
                        cart_image: cartImage,
                        total_price: totalProductPrice,
                        total_price_original: origin_totalProductPrice
                    });
                });
                cartSubtotal = Math.round(cartSubtotal * 100) / 100;
                cartSubtotalOriginal = Math.round(cartSubtotalOriginal * 100) / 100;
                let saving = cartSubtotalOriginal - cartSubtotal;

                const address = await Address.findOne({ customer_id: customer._id,  is_deleted:"no" });

                res.render("check-out", {
                    item_list: productResult,
                    cart_subtotal: cartSubtotal,
                    cart_subtotal_original: cartSubtotalOriginal,
                    cart_saving: saving,
                    address_result: address,
                    username: username
                });
            } else {
                res.status(400).send("Please check out from cart page.");
            }
        } catch (error) {
            console.error(error);
            res.status(500).send("Internal Server Error");
        }
    } else {
        res.status(400).send("Please Login your account first.");
    }
});

router.post('/', async (req, res) => {
    const data = req.body;
    if (data.request_type === 'sql_place_order') {
        try {
            const customer = await Customer.findOne({ customer_name: data.username });
            if (!customer) {
                return res.status(404).json({ code: 404, message: 'Customer not found' });
            }

            const manager = await Manager.findOne({manager_name:"Lucia"});
            if (!manager) {
                return res.status(404).json({ code: 404, message: 'Manager not found' });
            }

            const store = await Store.findOne({ store_name: "NIKE" });
            if (!store) {
                return res.status(404).json({ code: 404, message: 'Store not found' });
            }
            const cart = await Cart.findOne({ customer_id: customer._id });
            if (!cart) {
                return res.status(404).json({ code: 404, message: 'Cart not found' });
            }

            // Create order
            const newOrder = new Order({
                customer_id: customer._id,
                manager_id: manager._id,
                store_id: store._id,
                total_price: data.total_price,
                address_id: data.address_id,
                payment: data.payment
            });

            const savedOrder = await newOrder.save();

            // Add products to order
            for (let i = 0; i < data.product_id_list.length; i++) {
                const newOrdersProduct = new OrdersProduct({
                    order_id: savedOrder._id,
                    product_id: data.product_id_list[i],
                    quantity: data.quantity_list[i]
                });

                await newOrdersProduct.save();
            }

            console.log('cart',cart);
            for (let productId of data.product_id_list) {
                console.log('cart_id',cart._id);
                console.log('product_id',productId);
                await CartProduct.deleteOne({ cart_id: cart._id, product_id: productId });
            }

            const remainingCartProducts = await CartProduct.find({ cart_id: cart._id }).populate('product_id');
            let newTotalPrice = 0;
            remainingCartProducts.forEach(cp => {
                newTotalPrice += cp.quantity * cp.product_id.sale_price;
            });

            newTotalPrice = Math.round(newTotalPrice * 100) / 100;

            await Cart.updateOne({ _id: cart._id }, { $set: { total_price: newTotalPrice } });



            res.json({ code: 200, message: 'success' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ code: 500, message: 'error' });
        }
    } else {
        res.status(400).json({ code: 400, message: 'Invalid request type' });
    }
});

module.exports = router;