import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import axios from "axios";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import KnowledgeDetailModal from "../ai-modal/KnowledgeDetailModal";
import KnowledgeCreateModal from "../ai-modal/KnowledgeCreateModal";
import KnowledgeEditModal from "../../components/ai-modal/KnowledgeEditModal.jsx";
import BotDetailModal from "../ai-modal/BotDetailModal";
import "./style/KnowledgePage.css";

const KnowledgePage = () => {
  const { botId } = useParams();
  const location = useLocation();
  const isBusinessKnowledge = location.pathname.includes("business-dashboard");
  const [bot, setBot] = useState(null);
  const [knowledges, setKnowledges] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingKnowledge, setEditingKnowledge] = useState(null);
  const [showBotDetail, setShowBotDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredKnowledges = knowledges.filter(
    (k) =>
      k.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const fetchBot = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BE_URL}/api/aibot/${botId}`
      );
      setBot(res.data);
    } catch (err) {
      console.error("Error fetching bot:", err);
    }
  };

  const fetchKnowledge = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BE_URL}/api/botknowledge/${botId}`
      );
      setKnowledges(res.data);
    } catch (err) {
      console.error("Error fetching knowledge:", err);
    }
  };

  useEffect(() => {
    fetchBot();
    fetchKnowledge();
  }, [botId]);

  const deleteKnowledge = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa kiến thức này?")) return;
    try {
      await axios.delete(
        `${import.meta.env.VITE_BE_URL}/api/botknowledge/${id}`
      );

      fetchKnowledge();
    } catch (err) {
      console.error("Error deleting knowledge:", err);
    }
  };

  return (
    <div className="knowledge-page">
      {/* Header card */}
      <div className="knowledge-header-card">
        <h1 className="knowledge-title">
          {isBusinessKnowledge
            ? "🏢 Kiến thức doanh nghiệp"
            : "📘 Kiến thức học tập"}
        </h1>

        <div className="action-bar">
          <div className="search-container">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, nội dung hoặc tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <button className="add-button" onClick={() => setShowCreate(true)}>
            ➕{" "}
            {isBusinessKnowledge
              ? "Thêm kiến thức doanh nghiệp"
              : "Thêm kiến thức học tập"}
          </button>
        </div>
      </div>

      {/* Panel danh sách */}
      <div className="knowledge-list-panel">
        {bot && (
          <div className="bot-info-box">
            <p>
              <b>Bot ID:</b>{" "}
              <button
                className="bot-id-link"
                onClick={() => setShowBotDetail(true)}
              >
                {bot.id || bot._id}
              </button>
            </p>
            <p>
              <b>Tên:</b> {bot.name}
            </p>
            <p>
              <b>Mô tả:</b> {bot.description}
            </p>
          </div>
        )}

        {/* Table */}
        <div className="knowledge-table">
          <div className="knowledge-row header">
            <div className="col">Tên</div>
            <div className="col actions-col">Hành động</div>
          </div>

          {filteredKnowledges.map((k, idx) => (
            <div
              key={k._id}
              className={`knowledge-row ${idx % 2 === 0 ? "zebra" : ""}`}
            >
              <div className="knowledge-info-box">📄 {k.title}</div>
              <div className="actions">
                <button
                  style={{ backgroundColor: "#059669", ...btnStyle }}
                  onClick={() => setSelected(k)}
                  title="Xem"
                >
                  <FaEye size={14} />
                </button>
                <button
                  style={{ backgroundColor: "#3b82f6", ...btnStyle }}
                  onClick={() => setEditingKnowledge(k)}
                  title="Sửa"
                >
                  <FaEdit size={14} />
                </button>
                <button
                  style={{ backgroundColor: "#ef4444", ...btnStyle }}
                  onClick={() => deleteKnowledge(k._id)}
                  title="Xóa"
                >
                  <FaTrash size={14} />
                </button>
              </div>
            </div>
          ))}

          {filteredKnowledges.length === 0 && (
            <p className="empty">
              {knowledges.length === 0
                ? "Chưa có kiến thức nào"
                : "Không tìm thấy kết quả phù hợp"}
            </p>
          )}
        </div>
      </div>

      {/* Modals */}
      {selected && (
        <KnowledgeDetailModal
          knowledge={selected}
          onClose={() => setSelected(null)}
        />
      )}
      {showCreate && (
        <KnowledgeCreateModal
          botId={botId}
          onClose={() => setShowCreate(false)}
          onSave={fetchKnowledge}
        />
      )}
      {editingKnowledge && (
        <KnowledgeEditModal
          knowledge={editingKnowledge}
          onClose={() => setEditingKnowledge(null)}
          onSave={fetchKnowledge}
        />
      )}
      {showBotDetail && bot && (
        <BotDetailModal
          bot={bot}
          onClose={() => setShowBotDetail(false)}
          onSave={fetchBot}
        />
      )}
    </div>
  );
};

const btnStyle = {
  width: "32px",
  height: "32px",
  border: "none",
  borderRadius: "6px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
};

export default KnowledgePage;
