import React, { useState } from "react";
import axios from "axios";
import "../../components/ai-support/style/Modal.css";

const BotDetailModal = ({ bot, onClose, onSave }) => {
  const botId = bot._id || bot.id
  const [name, setName] = useState(bot.name || "");
  const [description, setDescription] = useState(bot.description || "");

 const handleSave = async () => {
  try {
    const botId = bot._id || bot.id; // fix undefined
    const res = await axios.put(
      `${import.meta.env.VITE_BE_URL}/api/aibot/${botId}`,
      { name, description }
    );

    console.log("✅ Update bot response:", res.data);

    onSave(); // reload bot info
    onClose();
  } catch (err) {
    console.error("❌ Error updating bot:", err.response?.data || err.message);
    alert("Có lỗi khi cập nhật bot");
  }
};


  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3>Chi tiết Bot</h3>

        <label>Tên bot:</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nhập tên bot"
        />

        <label>Mô tả:</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Nhập mô tả bot"
        />

        <div className="modal-actions">
          <button className="primary-btn" onClick={handleSave}>
            💾 Lưu
          </button>
          <button className="cancel-btn" onClick={onClose}>
            ❌ Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default BotDetailModal;
