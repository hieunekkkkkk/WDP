const mongoose = require('mongoose');

const businessRevenueSchema = new mongoose.Schema({
    business_id: { type: mongoose.Schema.Types.ObjectId, ref: 'business' },
    revenue_name: String,
    revenue_description: String,
    revenue_date: Date,
    revenue_amount: Number,
});

module.exports = mongoose.model('businessRevenue', businessRevenueSchema);