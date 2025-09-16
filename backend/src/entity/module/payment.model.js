const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user_id: String, // Cho phép cả ObjectId và String
  payment_amount: Number,
  payment_stack: { type: mongoose.Schema.Types.ObjectId, ref: 'stack' },
  payment_date: { type: Date, default: Date.now },
  payment_status: String, // ENUM: pending, completed, failed
  payment_method: String, // ENUM: payos
  transaction_id: String
});

module.exports = mongoose.model('payment', paymentSchema);