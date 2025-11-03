// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
    {
        clerkId: { type: String, unique: true, required: true },
        email: { type: String, required: true },
        fullName: { type: String },
        role: { type: String, default: 'client' },
        imageUrl: { type: String },
        locked: { type: Boolean, default: false },
        publicMetadata: { type: Object, default: {} },
        privateMetadata: { type: Object, default: {} },
        lastSyncedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);
