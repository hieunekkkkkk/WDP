const mongoose = require('mongoose');

const businessViewSchema = new mongoose.Schema({
  business_id: { type: mongoose.Schema.Types.ObjectId, ref: 'business' },
  view_date: { type: Number, default: () => Date.now() },
  view_count: { type: Number, default: 1 },
});

module.exports = mongoose.model('businessView', businessViewSchema);
