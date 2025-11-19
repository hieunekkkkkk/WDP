import React, { useEffect, useState, useCallback } from "react";
import { useParams, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import { useUser } from "@clerk/clerk-react";
import KnowledgeDetailModal from "../ai-modal/KnowledgeDetailModal";
import KnowledgeCreateModal from "../ai-modal/KnowledgeCreateModal";
import KnowledgeEditModal from "../../components/ai-modal/KnowledgeEditModal.jsx";
import BotDetailModal from "../ai-modal/BotDetailModal";
import BotCreateModal from "../ai-modal/BotCreateModal";
import "./style/KnowledgePage.css";

const KnowledgePage = () => {
  const { botId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useUser();
  const isBusinessKnowledge = location.pathname.includes("business-dashboard");
  const isCreateBotMode = botId === 'create-bot';
  const [bot, setBot] = useState(null);
  const [knowledges, setKnowledges] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingKnowledge, setEditingKnowledge] = useState(null);
  const [showBotDetail, setShowBotDetail] = useState(false);
  const [showCreateBot, setShowCreateBot] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const filteredKnowledges = knowledges.filter(
    (k) =>
      k.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const fetchBot = useCallback(async () => {
    try {
      setError(null);
      const res = await axios.get(
        `${import.meta.env.VITE_BE_URL}/api/aibot/${botId}`
      );
      setBot(res.data);
    } catch (err) {
      console.error("Error fetching bot:", err);
      const errorMessage =
        err.response?.data?.message || "Không thể tải thông tin bot";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [botId]);

  const fetchKnowledge = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(
        `${import.meta.env.VITE_BE_URL}/api/botknowledge/${botId}`
      );
      setKnowledges(res.data);
    } catch (err) {
      console.error("Error fetching knowledge:", err);
      const errorMessage =
        err.response?.data?.message || "Không thể tải danh sách kiến thức";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [botId]);

  useEffect(() => {
    // Kiểm tra nếu đang ở chế độ tạo bot mới
    if (isCreateBotMode) {
      const paymentStatus = searchParams.get('payment');
      if (paymentStatus === 'success') {
        setShowCreateBot(true);
      } else {
        // Không có payment success, redirect về my-ai
        navigate('/dashboard/my-ai', { replace: true });
      }
    } else {
      fetchBot();
      fetchKnowledge();
    }
  }, [isCreateBotMode, searchParams, navigate, fetchBot, fetchKnowledge]);

  // Handler khi tạo bot thành công
  const handleBotCreated = (newBot) => {
    const newBotId = newBot._id || newBot.id;
    // Redirect đến knowledge page của bot vừa tạo
    navigate(`/dashboard/knowledge/${newBotId}`, { replace: true });
  };

  const deleteKnowledge = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa kiến thức này?")) return;
    try {
      await axios.delete(
        `${import.meta.env.VITE_BE_URL}/api/botknowledge/${id}`
      );
      toast.success("✅ Xóa kiến thức thành công!");
      fetchKnowledge();
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

  // Nếu đang ở chế độ tạo bot, hiển thị background mờ + modal
  if (isCreateBotMode) {
    return (
      <>
        <div className="knowledge-page" style={{ filter: 'blur(5px)', pointerEvents: 'none' }}>
          {/* Background mờ */}
          <div className="knowledge-header-card">
            <h1 className="knowledge-title">📚 Quản lý kiến thức Bot</h1>
          </div>
          <div className="knowledge-list-panel">
            <div className="loading">
              <div className="loading-spinner"></div>
              Đang chuẩn bị tạo bot...
            </div>
          </div>
        </div>
        {/* Modal tạo bot */}
        {showCreateBot && (
          <BotCreateModal
            onClose={() => {
              // Không cho phép đóng modal, user phải hoàn thành tạo bot
              toast.warning('Bạn cần hoàn thành việc tạo bot để sử dụng dịch vụ!');
            }}
            onBotCreated={handleBotCreated}
          />
        )}
      </>
    );
  }

  return (
    <div className="knowledge-page">
      {/* Header - Thông tin Bot */}
      <div className="knowledge-header-card">
        <h1 className="knowledge-title">📚 Quản lý kiến thức Bot</h1>

        {!loading && !error && bot && (
          <div
            style={{
              marginTop: "16px",
              padding: "16px 20px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: "12px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: "700",
                    color: "white",
                    marginBottom: "6px",
                  }}
                >
                  🤖 {bot.name || "(chưa đặt tên)"}
                </div>
                <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.9)" }}>
                  {bot.description || "Chưa có mô tả"}
                </div>
              </div>
              <button
                onClick={() => setShowBotDetail(true)}
                style={{
                  padding: "10px 20px",
                  background: "white",
                  color: "#667eea",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  transition: "all 0.2s",
                }}
              >
                ✏️ Chỉnh sửa Bot
              </button>
            </div>
          </div>
        )}

        <div className="action-bar" style={{ marginTop: "16px" }}>
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
            ➕ Thêm kiến thức
          </button>
        </div>
      </div>

      {/* Panel danh sách */}
      <div className="knowledge-list-panel">
        {error && <div className="error-message">{error}</div>}

        {loading && (
          <div className="loading">
            <div className="loading-spinner"></div>
            Đang tải dữ liệu...
          </div>
        )}

        {/* Table */}
        <div className="knowledge-table">
          <div className="knowledge-row header">
            <div className="col">Tên</div>
            <div className="col actions-col">Hành động</div>
          </div>

          {loading && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
              Đang tải...
            </div>
          )}

          {!loading &&
            !error &&
            filteredKnowledges.map((k, idx) => (
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
