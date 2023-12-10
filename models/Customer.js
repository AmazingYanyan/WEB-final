const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CustomerSchema = new mongoose.Schema({
    customer_name: { type: String, unique: true },
    customer_password: String,
    customer_email: { type: String, unique: true },
    kind: { type: String, enum: ['business', 'home'] },
    marriage_status: { type: String, enum: ['married', 'unmarried'] },
    gender: { type: String, enum: ['male', 'female'] },
    age: Number,
    income: Number,
    business_category: String,
    company_gross_annual_income: Number
  }, { timestamps: true });
  
  module.exports = mongoose.model('Customer', CustomerSchema);
  