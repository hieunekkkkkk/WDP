const mongoose = require('mongoose');

const botKnowledgeSchema = new mongoose.Schema({
    aibot_id: { type: mongoose.Schema.Types.ObjectId, ref: 'aiBot' },
    created_by: String,
    title: String,
    content: String,
    tags: [String],
    created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('botKnowledge', botKnowledgeSchema);