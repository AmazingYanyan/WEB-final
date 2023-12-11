// Route handlers
const express = require('express');
const router = express.Router()

const Product = require('../models/Product');
const Cart = require('../models/Cart');
const CartProduct = require('../models/CartProduct');
const Customer = require('../models/Customer'); 

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

router.get('/', async (req, res) => {
    try {
        let username = req.query.username || req.cookies.username;
        let type = req.query.type;
        let customer = null;

        if (username) {
            customer = await Customer.findOne({ customer_name: username });
            if (customer) {
                req.cookies.userid = customer._id; // todo: use a session method
            }
        }

        const products = await Product.find({ is_sale: true }).sort({ _id: 1 });

        const imgList = products.map(product => ({
            product_id: product._id,
            images: product.product_image.split(',').slice(0, 2)
        }));

        // todo: create popular and most recent products
        const popularProducts = products.slice(0, 4);
        const recentProducts = products.slice(0, 2);

        const shuffledProducts = shuffleArray(products);

        res.render("shop", {
            item_list: shuffledProducts,
            img_list: imgList,
            username: username,
            popular_product_list: popularProducts,
            recent_list: recentProducts,
            type: type ? type : 'no'
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});


router.post('/add-cart', async (req, res) => {
    const data = req.body;
    const productId = data.product_id;
    const salePrice = parseFloat(data.sale_price.replace('$', ''));
    const customerId = req.cookies.userid;

    try {
        // Find or create the cart
        let cart = await Cart.findOne({ customer_id: customerId });
        if (!cart) {
            cart = new Cart({ customer_id: customerId, total_price: salePrice });
            await cart.save();
        } else {
            cart.total_price += salePrice;
            cart.total_price = Math.round(cart.total_price * 100) / 100;
            await cart.save();
        }

        // Add or update the product in the cart
        let cartProduct = await CartProduct.findOne({ cart_id: cart._id, product_id: productId });
        if (!cartProduct) {
            cartProduct = new CartProduct({ cart_id: cart._id, product_id: productId, quantity: 1 });
        } else {
            cartProduct.quantity += 1;
        }
        await cartProduct.save();

        res.json({ code: 200, message: 'Product added to cart successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ code: 500, message: 'SQL Execution Failed' });
    }
});


router.post('/add_cart_small_shop', async (req, res) => {
    const data = req.body;

    if (data.request_type === 'add_cart_small_shop_item') {
        const productId = data.product_id;
        const salePrice = parseFloat(data.sale_price.replace('$', ''));
        const addQuantity = parseInt(data.quantity);
        const addPrice = salePrice * addQuantity;
        const customerId = req.cookies.userid; // Ensure you are getting customerId correctly

        try {
            // Find or create the cart
            let cart = await Cart.findOne({ customer_id: customerId });
            if (!cart) {
                cart = new Cart({ customer_id: customerId, total_price: addPrice });
                await cart.save();
            } else {
                cart.total_price += addPrice;
                await cart.save();
            }

            // Add or update the product in the cart
            let cartProduct = await CartProduct.findOne({ cart_id: cart._id, product_id: productId });
            if (!cartProduct) {
                cartProduct = new CartProduct({ cart_id: cart._id, product_id: productId, quantity: addQuantity });
            } else {
                cartProduct.quantity += addQuantity;
            }
            await cartProduct.save();

            res.json({ code: 200, message: 'Product added to cart successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ code: 500, message: 'SQL Execution Failed' });
        }
    } else {
        res.status(400).json({ code: 400, message: 'Invalid request type' });
    }
});


module.exports = router;