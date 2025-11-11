const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  owner_id: String,
  business_name: String,
  business_address: String,
  business_location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  business_category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'category' },
  business_detail: String,
  business_time: {
    open: String,
    close: String
  },
  business_phone: String,
  business_image: [String],
  business_total_vote: Number,
  business_rating: Number,
  business_status: Boolean,
  business_active: { type: String, enum: ['active', 'inactive', 'pending'], default: 'pending' },
  business_priority: { type: Number, default: 0 },
  updated_at: { type: Date, default: Date.now },
});


businessSchema.index({
  business_location: '2dsphere',
  business_priority: -1,
  business_rating: -1,
  business_total_vote: -1
});

module.exports = mongoose.model('business', businessSchema);
