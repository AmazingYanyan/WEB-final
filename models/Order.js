const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrdersSchema = new mongoose.Schema({
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  store_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
  manager_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Manager' },
  total_price: { type: Number, default: 0 },
  order_date: Date,
  address_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Address' },
  payment: { type: String, enum: ['visa', 'applepay', 'paypal'] },
  order_status: { type: String, enum: ['ordered', 'shipped', 'delivered', 'returning'], default: 'ordered' }
}, { timestamps: true });

module.exports = mongoose.model('Orders', OrdersSchema);

  