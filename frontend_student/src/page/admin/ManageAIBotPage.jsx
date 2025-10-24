import React, { useState, useEffect } from "react";
import axios from "axios";
import Modal from "react-modal";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { FaRegCircleCheck } from "react-icons/fa6";
import { IoBanSharp } from "react-icons/io5";
import { RiLoginCircleLine } from 'react-icons/ri';

import Header from "../../components/Header";
import HeroSectionAdmin from "../../components/HeroSectionAdmin";

import "../../css/ManageAIBotsPage.css";

function ManageAIBotPage() {
  const [bots, setBots] = useState([]);
  const [search, setSearch] = useState("");
  const [sortStatus, setSortStatus] = useState("Newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [ownerNames, setOwnerNames] = useState({});
  const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = useState(false);
  const [selectedBotKnowledge, setSelectedBotKnowledge] = useState([]);
  const [selectedBotName, setSelectedBotName] = useState("");

  const limit = 5;
  Modal.setAppElement("#root");

  useEffect(() => {
    fetchBots();
  }, []);

  const fetchBots = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/aibot");
      const botsData = res.data || [];

      setTotalPages(Math.ceil(botsData.length / limit));
      setBots(botsData.slice(0, limit));

      const ownerIds = [...new Set(botsData.map((b) => b.ownerId))];
      const ownerResponses = await Promise.all(
        ownerIds.map((id) =>
          axios
            .get(`${import.meta.env.VITE_BE_URL}/api/user/${id}`)
            .catch(() => null)
        )
      );

      const nameMap = {};
      ownerResponses.forEach((res) => {
        const user = res?.data;
        if (user?.id) nameMap[user.id] = user.fullName;
      });
      setOwnerNames(nameMap);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải danh sách bot");
    }
  };

  const updateBotStatus = async (index, name, newStatus) => {
    const loadingToastId = toast.loading("Đang cập nhật trạng thái bot...");
    try {
      const bot = bots[index];
      await axios.put(`http://localhost:3000/api/aibot/${bot.id}`, {
        status: newStatus,
      });

      const updated = [...bots];
      updated[index].status = newStatus;
      setBots(updated);

      toast.dismiss(loadingToastId);
      toast.success(
        `${
          newStatus === "active" ? "Kích hoạt" : "Vô hiệu hóa"
        } bot "${name}" thành công!`
      );
    } catch (err) {
      console.error("PUT error:", err);
      toast.dismiss(loadingToastId);
      toast.error(`Không thể cập nhật trạng thái cho "${name}"`);
    }
  };

  const handleBan = (index, name) => updateBotStatus(index, name, "inactive");
  const handleActivate = (index, name) =>
    updateBotStatus(index, name, "active");
  const handleRejectPending = (index, name) =>
    updateBotStatus(index, name, "inactive");

  const handleViewKnowledge = (bot) => {
    // make sure bot object is valid
    if (!bot) return;
    setSelectedBotKnowledge(bot.knowledge || []);
    setSelectedBotName(bot.name);
    setIsKnowledgeModalOpen(true);
  };

  const closeKnowledgeModal = () => {
    setSelectedBotKnowledge([]);
    setSelectedBotName("");
    setIsKnowledgeModalOpen(false);
  };

  const filteredBots = bots.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.ownerId.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = ["Active", "Inactive", "Pending"].includes(sortStatus)
      ? b.status === sortStatus.toLowerCase()
      : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <Header />
      <HeroSectionAdmin
        message={
          <>
            Trang quản lý <br /> AI Bot
          </>
        }
      />

      {/* Knowledge Modal */}
      <Modal
        isOpen={isKnowledgeModalOpen}
        onRequestClose={closeKnowledgeModal}
        contentLabel="Bot Knowledge Modal"
        className="bot-knowledge-modal"
        overlayClassName="bot-knowledge-overlay"
      >
        <div className="knowledge-modal-content">
          <h2 className="knowledge-modal-title">
            🧠 Kiến thức của Bot: {selectedBotName}
          </h2>
          {selectedBotKnowledge.length > 0 ? (
            <div className="knowledge-list">
              {selectedBotKnowledge.map((k, idx) => (
                <div key={idx} className="knowledge-item">
                  <h3>{k.title}</h3>
                  <div className="knowledge-content">{k.content}</div>
                  {k.tags?.length > 0 && (
                    <div className="knowledge-tags">
                      {k.tags.map((tag, i) => (
                        <span key={i} className="tag">
                          {tag.replace(/["\[\]]/g, "")}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="knowledge-empty">Không có kiến thức nào được thêm.</p>
          )}
          <button onClick={closeKnowledgeModal} className="knowledge-close-btn">
            Đóng
          </button>
        </div>
      </Modal>

      {/* Main Table */}
      <div className="manage-business-container">
        <div className="manage-business-table-header">
          <div className="manage-business-search-bar">
            <input
              type="text"
              placeholder="Tìm theo tên bot hoặc ID chủ sở hữu"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="manage-business-sort-select">
            <select
              value={sortStatus}
              onChange={(e) => setSortStatus(e.target.value)}
            >
              <option value="Active">Kích hoạt</option>
              <option value="Inactive">Vô hiệu hóa</option>
              <option value="Pending">Tạm chờ</option>
            </select>
          </div>
        </div>

        <div className="manage-business-table-container">
          <table className="manage-business-table">
            <thead>
              <tr>
                <th>Tên bot</th>
                <th>Chủ sở hữu</th>
                <th>Mô tả</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="wait">
                {filteredBots.map((b, i) => (
                  <motion.tr
                    key={b.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                  >
                    <td>{b.name}</td>
                    <td>{ownerNames[b.ownerId] || "Loading..."}</td>
                    <td>{b.description || "Không có mô tả"}</td>
                    <td>
                      <span
                        className={`manage-business-status ${b.status.toLowerCase()}`}
                      >
                        {b.status === "active" && <p>Hoạt động</p>}
                        {b.status === "pending" && <p>Chờ kiểm duyệt</p>}
                        {b.status === "inactive" && <p>Bị khóa</p>}
                      </span>
                    </td>
                    <td className="manage-business-actions-icons">
                      {b.status === "inactive" && (
                        <FaRegCircleCheck
                          className="manage-business-actions action-check"
                          onClick={() => handleActivate(i, b.name)}
                          title="Kích hoạt bot"
                        />
                      )}
                      {b.status === "active" && (
                        <IoBanSharp
                          className="manage-business-actions action-ban"
                          onClick={() => handleBan(i, b.name)}
                          title="Vô hiệu hóa bot"
                        />
                      )}
                      {b.status === "pending" && (
                        <>
                          <FaRegCircleCheck
                            className="manage-business-actions action-check"
                            onClick={() => handleActivate(i, b.name)}
                            title="Chấp nhận bot"
                          />
                          <IoBanSharp
                            className="manage-business-actions action-ban"
                            onClick={() => handleRejectPending(i, b.name)}
                            title="Từ chối bot"
                          />
                        </>
                      )}
                      {/* Open knowledge modal */}
                      <RiLoginCircleLine
                        className="manage-business-actions enter"
                        onClick={() => handleViewKnowledge(b)}
                        title="Xem kiến thức bot"
                      />
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="manage-business-pagination">
          <button
            className="nav-btn"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            &lt;
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              className={`page-btn ${currentPage === i + 1 ? "active" : ""}`}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button
            className="nav-btn"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            &gt;
          </button>
        </div>
      </div>
    </>
  );
}

export default ManageAIBotPage;
