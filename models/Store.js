const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StoreSchema = new Schema({
    store_name: String,
    link: String,
    manager_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Manager' }
  });
  
  module.exports = mongoose.model('Store', StoreSchema);
  