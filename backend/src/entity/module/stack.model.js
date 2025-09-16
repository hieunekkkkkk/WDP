const mongoose = require('mongoose');

const stackSchema = new mongoose.Schema({
  stack_name: String,
  stack_price: String,
  stack_detail: String
});

module.exports = mongoose.model('stack', stackSchema);