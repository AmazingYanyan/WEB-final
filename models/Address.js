const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AddressSchema = new mongoose.Schema({
  customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  street: String,
  city: String,
  state: String,
  zipcode: String,
  is_deleted: { type: String, enum: ['yes', 'no'], default: 'no' }
}, { timestamps: true });

module.exports = mongoose.model('Address', AddressSchema);

  