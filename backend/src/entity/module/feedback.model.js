const mongoose = require('mongoose');

const feedbackschema = new mongoose.Schema({
    user_id: String,
    business_id: { type: mongoose.Schema.Types.ObjectId, ref: 'business' },
    product_id: { type: mongoose.Schema.Types.ObjectId, required: false },
    feedback_type: {
        type: String,
        enum: ['product', 'business']
    },
    feedback_comment: String,
    feedback_rating: {
        type: Number,
        min: 1,
        max: 5,
        default: 5
    },
    feedback_response: String,
    feedback_like: Number,
    feedback_dislike: Number,
    feedback_date: { type: Date, default: Date.now },
});

module.exports = mongoose.model('feedback', feedbackschema);