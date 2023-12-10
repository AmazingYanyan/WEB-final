const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrdersProductSchema = new mongoose.Schema({
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Orders' },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  quantity: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('OrdersProduct', OrdersProductSchema);

  