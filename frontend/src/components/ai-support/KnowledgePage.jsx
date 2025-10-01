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
  const [filter, setFilter] = useState("Tất cả");
  const [showBotDetail, setShowBotDetail] = useState(false);

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
        `${import.meta.env.VITE_BE_URL}/api/botknowledge`
      );
      const filtered = res.data.filter((k) => k.aibot_id === botId);
      setKnowledges(filtered);
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

  const filteredKnowledge =
    filter === "Tất cả"
      ? knowledges
      : knowledges.filter((k) => k.type === filter);

  return (
    <div className="knowledge-page">
      <div className="knowledge-header">
        <h1 className="knowledge-title">
          {isBusinessKnowledge
            ? "🏢 Kiến thức doanh nghiệp"
            : "📘 Kiến thức học tập"}
        </h1>
      </div>

      <div className="add-knowledge-top">
        <button className="knowledge-btn" onClick={() => setShowCreate(true)}>
          ➕ Thêm{" "}
          {isBusinessKnowledge ? "kiến thức doanh nghiệp" : "kiến thức học tập"}
        </button>
      </div>

      {/* Panel danh sách */}
      <div className="knowledge-list-panel">
        {bot && (
          <div className="bot-info-box">
            <p>
              <b>Bot ID:</b>{" "}
              <span className="link" onClick={() => setShowBotDetail(true)}>
                {bot.id || bot._id}
              </span>
            </p>
            <p>
              <b>Tên:</b> {bot.name}
            </p>
            <p>
              <b>Mô tả:</b> {bot.description}
            </p>
          </div>
        )}

        {/* Dropdown filter */}
        <div className="filter-box">
          <label>Loại: </label>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option>Tất cả</option>
            <option>Liên kết</option>
            <option>Văn bản</option>
          </select>
        </div>

        {/* Table */}
        <div className="knowledge-table">
          <div className="knowledge-row header">
            <div className="col">Tên</div>
            <div className="col actions-col">Hành động</div>
          </div>

          {filteredKnowledge.map((k) => (
            <div key={k._id} className="knowledge-row">
              <div className="knowledge-info-box">{k.title}</div>
              <div className="actions">
                <button
                  style={{
                    backgroundColor: "#059669",
                    width: "32px",
                    height: "32px",
                    border: "none",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                  }}
                  onClick={() => setSelected(k)}
                  title="Xem"
                >
                  <FaEye size={14} />
                </button>
                <button
                  style={{
                    backgroundColor: "#3b82f6",
                    width: "32px",
                    height: "32px",
                    border: "none",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                  }}
                  onClick={() => setEditingKnowledge(k)}
                  title="Sửa"
                >
                  <FaEdit size={14} />
                </button>
                <button
                  style={{
                    backgroundColor: "#ef4444",
                    width: "32px",
                    height: "32px",
                    border: "none",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                  }}
                  onClick={() => deleteKnowledge(k._id)}
                  title="Xóa"
                >
                  <FaTrash size={14} />
                </button>
              </div>
            </div>
          ))}

          {filteredKnowledge.length === 0 && (
            <p className="empty">Chưa có kiến thức nào</p>
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

export default KnowledgePage;
