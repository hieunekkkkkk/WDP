const mongoose = require('mongoose');

const aiBotSchema = new mongoose.Schema({
  owner_id: String,
  name: String,
  description: String,
  status: { type: String, enum: ['active', 'inactive'], default: 'inactive' },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('aiBot', aiBotSchema);