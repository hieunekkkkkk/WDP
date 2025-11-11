const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema(
    {
        title: String,
        description: String,
        author: String,
        date: { type: Date, default: Date.now },
        category: String,
        used: { type: Boolean, default: true },
        driveUrl: String,
    },
    { timestamps: true }
);

module.exports = mongoose.model('Subject', SubjectSchema);