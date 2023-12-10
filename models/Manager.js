const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ManagerSchema = new mongoose.Schema({
  manager_name: { type: String, unique: true },
  manager_password: String,
  manager_email: { type: String, unique: true }
}, { timestamps: true });

module.exports = mongoose.model('Manager', ManagerSchema);

  