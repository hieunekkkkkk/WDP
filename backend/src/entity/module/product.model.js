const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  business_id: { type: mongoose.Schema.Types.ObjectId, ref: 'business' },
  product_name: String,
  product_image: [String],
  product_description: String,
  product_number: Number,
  product_price: String,
  product_total_vote: Number,
  product_rating: Number
});

module.exports = mongoose.model('product', productSchema);