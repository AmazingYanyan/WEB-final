const express = require('express');
const router = express.Router();

const Customer = require('../models/Customer');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const CartProduct = require('../models/CartProduct');

router.get('/', async (req, res) => {
    let username = req.query.username || req.cookies.username;

    if (username && username.length > 0) {
        try {
            const customer = await Customer.findOne({ customer_name: username });
            if (customer) {
                const cart = await Cart.findOne({ customer_id: customer._id });
                if (cart) {
                    const cartProducts = await CartProduct.find({ cart_id: cart._id }).populate('product_id');
                    let cartSubtotal = 0;
                    let cartSubtotalOriginal = 0;
                    let productResult = cartProducts.map(cp => {
                        let product = cp.product_id;
                        let cartImage = product.product_image.split(',')[0]; 
                        let totalProductPrice = cp.quantity * product.sale_price;
                        let origin_totalProductPrice = cp.quantity * product.original_price;
                        totalProductPrice = Math.round(totalProductPrice * 100) / 100;
                        origin_totalProductPrice = Math.round(origin_totalProductPrice * 100) / 100;
                        cartSubtotal += totalProductPrice;
                        cartSubtotalOriginal += origin_totalProductPrice
                        return {
                            ...product.toJSON(),
                            quantity: cp.quantity,
                            cart_image: cartImage,
                            total_price: totalProductPrice,
                            total_price_original : origin_totalProductPrice
                        };
                    });

                    res.render("cart", {
                        cart_idprice: cart,
                        item_list: productResult,
                        cart_subtotal: cartSubtotal,
                        cart_subtotal_original: cartSubtotalOriginal,
                        username: username
                    });
                } else {

                    res.status(400).send("No carts created.");
                }
            } else {
                res.status(400).send("Please log in your account first.");
            }
        } catch (error) {
            console.error(error);
            res.status(500).send("Internal Server Error");
        }
    } else {
        res.status(400).send("Please log in your account first.");
    }
});


router.put('/update-item', async (req, res) => {
    const data = req.body;
    if (data.request_type === 'sql_update_quantity') {
        try {
            const customer = await Customer.findOne({ customer_name: data.username });
            if (!customer) {
                return res.status(404).json({ code: 404, message: 'Customer not found' });
            }

            let cart = await Cart.findOne({ customer_id: customer._id });
            if (!cart) {
                return res.status(404).json({ code: 404, message: 'Cart not found' });
            }

            // Update the quantity of the product in the cart
            const updated = await CartProduct.updateOne(
                { cart_id: cart._id, product_id: data.product_id },
                { $set: { quantity: data.quantity } }
            );

            if (updated.modifiedCount === 0) {
                return res.status(404).json({ code: 404, message: 'Product not found in cart' });
            }

            // Recalculate the total price
            const cartProducts = await CartProduct.find({ cart_id: cart._id }).populate('product_id');
            let cartSubtotal = cartProducts.reduce((total, cp) => {
                return total + (cp.quantity * cp.product_id.sale_price);
            }, 0);

            cart.total_price = Math.round(cartSubtotal * 100) / 100;
            await cart.save();

            res.json({ code: 200, message: 'Cart updated successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ code: 500, message: 'error' });
        }
    } else {
        res.status(400).json({ code: 400, message: 'Invalid request type' });
    }
});

router.delete('/del-item', async (req, res) => {
    const data = req.body;

    if (data.request_type === 'sql_delete_cart_product') {
        try {
            // Find the customer to get the cart ID
            const customer = await Customer.findOne({ customer_name: data.username });
            if (!customer) {
                return res.status(404).json({ code: 404, message: 'Customer not found' });
            }

            const cart = await Cart.findOne({ customer_id: customer._id });
            if (!cart) {
                return res.status(404).json({ code: 404, message: 'Cart not found' });
            }

            // Delete the product from the cart
            const deleted = await CartProduct.deleteOne({
                cart_id: cart._id,
                product_id: data.product_id
            });

            if (deleted.deletedCount === 0) {
                return res.status(404).json({ code: 404, message: 'Product not found in cart' });
            }

            // Recalculate the total price
            const cartProducts = await CartProduct.find({ cart_id: cart._id }).populate('product_id');
            let cartSubtotal = cartProducts.reduce((total, cp) => {
                return total + (cp.quantity * cp.product_id.sale_price);
            }, 0);

            cart.total_price = Math.round(cartSubtotal * 100) / 100;
            await cart.save();

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