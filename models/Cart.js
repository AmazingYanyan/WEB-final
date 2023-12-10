const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CartSchema = new mongoose.Schema({
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  total_price: { type: Number, default: 0.0 }
}, { timestamps: true });

module.exports = mongoose.model('Cart', CartSchema);

  