// models/Chat.js
const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
    chatId: { type: String, required: true, unique: true },
    senderId: { type: String, required: true },
    receiverId: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Chat", chatSchema);
