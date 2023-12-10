const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CartProductSchema = new mongoose.Schema({
  cart_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Cart' },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  quantity: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('CartProduct', CartProductSchema);

  