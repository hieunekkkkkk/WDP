const mongoose = require('mongoose');

const businessViewSchema = new mongoose.Schema({
  bussiness_id: { type: mongoose.Schema.Types.ObjectId, ref: 'business' },
  view_date: Date,
  view_count: Number,
});

module.exports = mongoose.model('businessView', businessViewSchema);