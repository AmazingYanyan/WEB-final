const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
    product_name: String,
    inventory_amount: Number,
    original_price: Number,
    sale_price: Number,
    product_type: String,
    is_sale: Boolean,
    store_id: Number,
    product_description: String,
    product_image: String
  });
  
  module.exports = mongoose.model('Product', ProductSchema);
  