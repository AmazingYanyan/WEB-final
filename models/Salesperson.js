const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SalespersonSchema = new Schema({
    salesperson_name: String,
    salesperson_password: String,
    salesperson_email: String,
    job_title: String,
    store_id: Number,
    manager_id: Number,
    salary: Number
  });
  
  module.exports = mongoose.model('Salesperson', SalespersonSchema);
  