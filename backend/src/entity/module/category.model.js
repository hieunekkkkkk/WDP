const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  category_name: String,
  icon: String,
});

module.exports = mongoose.model('category', categorySchema); 