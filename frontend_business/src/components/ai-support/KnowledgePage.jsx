import React, { useEffect, useState, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom"; // Import useNavigate
import axios from "axios";
import { useUser } from "@clerk/clerk-react"; // Import useUser
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import KnowledgeDetailModal from "../ai-modal/KnowledgeDetailModal";
import KnowledgeCreateModal from "../ai-modal/KnowledgeCreateModal";
import KnowledgeEditModal from "../../components/ai-modal/KnowledgeEditModal.jsx";
import BotDetailModal from "../ai-modal/BotDetailModal";
import "./style/KnowledgePage.css";
import { FaPlus } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

const KnowledgePage = () => {
  const { botId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const navigate = useNavigate();
  const { user } = useUser();

  const isBusinessKnowledge = location.pathname.includes("business-dashboard");
  const [bot, setBot] = useState(null);
  const [knowledges, setKnowledges] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingKnowledge, setEditingKnowledge] = useState(null);
  const [showBotDetail, setShowBotDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [knowledgeToDeleteId, setKnowledgeToDeleteId] = useState(null);

  const filteredKnowledges = knowledges.filter(
    (k) =>
      k.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const fetchBot = useCallback(async () => {
    if (!user) return;
    if (!user) return;

    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BE_URL}/api/aibot/${botId}`
      );

      if (res.data.ownerId !== user.id) {
        console.warn("Access Denied: User is not the owner of this bot.");
        navigate("/business-dashboard/my-ai");
        return;
      }

      setBot(res.data);
      setBot(res.data);
    } catch (err) {
      console.error("Error fetching bot:", err);
      if (err.response && err.response.status === 500) {
        navigate("/business-dashboard/my-ai");
      }
    }
  }, [botId, user, navigate]);

  const fetchKnowledge = useCallback(async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BE_URL}/api/botknowledge/${botId}`
      );
      setKnowledges(res.data);
    } catch (err) {
      console.error("Error fetching knowledge:", err);
    }
  }, [botId]); 

  useEffect(() => {
    if (user) {
      fetchBot();
      fetchKnowledge();
    }
  }, [botId, user, fetchBot, fetchKnowledge]);

  const handleDeleteClick = (id) => {
    setKnowledgeToDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!knowledgeToDeleteId) return;

    setIsDeleteModalOpen(false);
    try {
      const promise = axios.delete(
        `${import.meta.env.VITE_BE_URL}/api/botknowledge/${knowledgeToDeleteId}`
      );
      toast.success("✅ Xóa kiến thức thành công!");
      fetchKnowledge(); // Gọi lại fetchKnowledge sau khi xóa thành công
    } catch (err) {
      console.error("❌ Error deleting knowledge:", err.response?.data || err.message);

      const errorMessage = err.response?.data?.message || err.message || "Có lỗi khi xóa kiến thức";

      // Kiểm tra nếu là lỗi Qdrant
      if (errorMessage.includes("Qdrant") || errorMessage.includes("ECONNREFUSED")) {
        toast.warning("⚠️ Kiến thức đã được xóa nhưng không thể cập nhật index. Vui lòng khởi động Qdrant service!");
      } else {
        toast.error(`❌ Lỗi: ${errorMessage}`);
      }
    }
  };

  return (
    <div className="knowledge-page">
      {/* Header card */}
      <div className="knowledge-header-card">
        <h1 className="knowledge-title">
          {isBusinessKnowledge ? "Kiến thức doanh nghiệp" : "Kiến thức học tập"}
        </h1>

        <div className="action-bar">
          <div className="search-container">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, nội dung hoặc tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              style={{margin: 0}}
            />
          </div>
          <button
            className="add-button"
            onClick={() => setShowCreate(true)}
            style={{ display: "flex", alignItems: "center", gap: 10 }}
          >
            <FaPlus /> {"    "}
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
            <div className="col actions-col" style={{ textAlign: "center" }}>
              Hành động
            </div>
          </div>

          {filteredKnowledges.map((k, idx) => (
            <div
              key={k._id}
              className={`knowledge-row ${idx % 2 === 0 ? "zebra" : ""}`}
            >
              <div className="knowledge-info-box">{k.title}</div>
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
                  onClick={() => handleDeleteClick(k._id)}
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
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div
            className="modal-overlay" // Đảm bảo bạn có CSS cho class này
            onClick={() => setIsDeleteModalOpen(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 9999,
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: "#fff",
                padding: "30px",
                borderRadius: "10px",
                maxWidth: "350px",
                width: "90%",
                textAlign: "center",
                boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
              }}
            >
              <h3>Xác nhận xóa</h3>
              <p style={{ margin: "15px 0" }}>
                Bạn có chắc chắn muốn xóa kiến thức này không?
              </p>
              <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: "10px 20px",
                    cursor: "pointer",
                    background: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    fontWeight: "bold",
                  }}
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDelete} 
                  style={{
                    flex: 1,
                    padding: "10px 20px",
                    cursor: "pointer",
                    background: "#dc3545", 
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    fontWeight: "bold",
                  }}
                >
                  Xóa
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
