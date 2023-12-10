const express = require('express');
const router = express.Router();

const Product = require('../models/Product');

router.get('/', async (req, res) => {
    const product_id = req.query.product_id || req.body.product_id
    if (product_id) {

        if (!product_id) {
            return res.status(400).json({ code: 400, message: 'Product ID is required' });
        }

        try {
            const product = await Product.findById(product_id);

            if (!product) {
                return res.status(404).json({ code: 404, message: 'Product not found' });
            }

            const productData = {
                product_id: product._id.toString(),
                product_name: product.product_name,
                inventory_amount: product.inventory_amount,
                original_price: product.original_price,
                sale_price: product.sale_price,
                product_type: product.product_type,
                is_sale: product.is_sale,
                store_id: product.store_id,
                product_description: product.product_description,
                product_image: product.product_image.split(',')
            };

            // console.log(productData);
            res.render('small-shop-item', { item: productData });
        } catch (error) {
            console.error(error);
            res.status(500).json({ code: 500, message: 'SQL Execution Failed' });
        }
    } else {
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;