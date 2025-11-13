import React, { useState, useEffect } from "react";
import HeroSectionAdmin from "../../components/HeroSectionAdmin";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import "../../css/ManageUserPage.css";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { FaRegCircleCheck } from "react-icons/fa6";
import { IoBanSharp } from "react-icons/io5";
import { getCurrentUserId } from "../../utils/useCurrentUserId";
import { FaSyncAlt } from "react-icons/fa";

function ManageUserPage() {
  const currentUserId = getCurrentUserId();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [sortStatus, setSortStatus] = useState("All");
  const [sortRole, setSortRole] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [updatingUserId, setUpdatingUserId] = useState(null); // <-- THÊM STATE LOADING

  const limit = 5;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BE_URL}/api/user`);
      setUsers(res.data.users || res.data);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải danh sách người dùng");
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      (user.fullName.toLowerCase().includes(search.toLowerCase()) ||
        user.clerkId.toLowerCase().includes(search.toLowerCase())) &&
      (sortStatus === "All" ||
        (user.publicMetadata.locked ?? false) === (sortStatus === "true")) &&
      (sortRole === "All" || user.publicMetadata.role === sortRole)
  );

  const totalPages = Math.ceil(filteredUsers.length / limit);

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * limit,
    currentPage * limit
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortStatus, sortRole]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // --- HÀM LOCK/UNLOCK ĐÃ ĐƯỢC CẬP NHẬT ---
  const updateUserLock = async (userId, lock) => {
    // 1. Kiểm tra xem có đang xử lý ai không, nếu có thì dừng
    if (updatingUserId) return; 
    
    // 2. Đặt trạng thái loading cho user này
    setUpdatingUserId(userId);

    const loadingId = toast.loading(
      lock ? "Đang khóa người dùng…" : "Đang mở khóa người dùng…"
    );
    try {
      const endpoint = lock
        ? `${import.meta.env.VITE_BE_URL}/api/user/${userId}/lock`
        : `${import.meta.env.VITE_BE_URL}/api/user/${userId}/unlock`;

      await axios.put(endpoint);

      toast.dismiss(loadingId);
      toast.success(lock ? "Đã khóa người dùng" : "Đã mở khóa người dùng");
      fetchUsers();
    } catch (error) {
      toast.dismiss(loadingId);
      toast.error(
        lock ? "Không thể khóa người dùng" : "Không thể mở khóa người dùng"
      );
    } finally {
      // 3. Xóa trạng thái loading bất kể thành công hay thất bại
      setUpdatingUserId(null); 
    }
  };

  const handleSyncUsers = async () => {
    const loadingId = toast.loading("Đang đồng bộ người dùng từ Clerk…");
    try {
      await axios.post(`${import.meta.env.VITE_BE_URL}/api/sync-clerk-users`);
      toast.dismiss(loadingId);
      toast.success("Đồng bộ người dùng thành công");
      setCurrentPage(1);
      fetchUsers();
    } catch (error) {
      toast.dismiss(loadingId);
      console.error("Lỗi khi đồng bộ:", error);
      toast.error("Đồng bộ người dùng thất bại");
    }
  };

  return (
    <>
      <Header />
      <HeroSectionAdmin
        message={
          <>
            Trang quản lý <br /> người dùng
          </>
        }
      />

      <div className="manage-user-container">
        <div className="manage-user-table-header">
          <div className="manage-user-search-bar">
            <input
              type="text"
              placeholder="Tìm theo ID, tên"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            className="manage-user-sync-btn"
            onClick={handleSyncUsers}
            title="Đồng bộ người dùng từ Clerk"
          >
            <FaSyncAlt />
            Đồng bộ
          </button>

          <div className="manage-user-sort-select">
            <select
              value={sortRole}
              onChange={(e) => setSortRole(e.target.value)}
            >
              <option value="All">Tất cả vai trò</option>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
              <option value="business">Business</option>
              <option value="client">Client</option>
            </select>
          </div>

          <div className="manage-user-sort-select">
            <select
              value={sortStatus}
              onChange={(e) => setSortStatus(e.target.value)}
            >
              <option value="All">Tất cả trạng thái</option>
              <option value="false">Hoạt động</option>
              <option value="true">Bị Khóa</option>
            </select>
          </div>
        </div>

        <div className="manage-user-table-container">
          <table className="manage-user-table">
            <thead>
              <tr>
                <th>Ảnh</th>
                <th>Tên người dùng</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="wait">
                {filteredUsers.length > 0 ? (
                  paginatedUsers.map((user) => (
                    <motion.tr
                      key={user.clerkId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                    >
                      <td>
                        <img
                          src={user.imageUrl}
                          alt={user.fullName}
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                          }}
                        />
                      </td>
                      <td>{user.fullName}</td>
                      <td>{user.email}</td>
                      <td className="manage-user-table-role">
                        {user.publicMetadata.role}
                      </td>
                      <td>
                        {user.publicMetadata.locked ? (
                          <span className="manage-user-status inactive">
                            Bị khóa
                          </span>
                        ) : (
                          <span className="manage-user-status active">
                            Hoạt động
                          </span>
                        )}
                      </td>
                      
                      {/* --- CẬP NHẬT JSX CHO NÚT --- */}
                      <td>
                        {user.role !== "admin" &&
                          (user.publicMetadata.locked ? (
                            <FaRegCircleCheck
                              // Thêm class 'disable' nếu đang loading
                              className={`manage-user-actions ${
                                updatingUserId === user.clerkId
                                  ? "disable"
                                  : "action-active"
                              }`}
                              onClick={() =>
                                updateUserLock(user.clerkId, false)
                              }
                              title="Kích hoạt người dùng"
                              // Thêm style cho con trỏ
                              style={{
                                cursor:
                                  updatingUserId === user.clerkId
                                    ? "wait"
                                    : "pointer",
                              }}
                            ></FaRegCircleCheck>
                          ) : (
                            <IoBanSharp
                              // Thêm class 'disable' nếu đang loading
                              className={`manage-user-actions ${
                                updatingUserId === user.clerkId
                                  ? "disable"
                                  : "action-inactive"
                              }`}
                              onClick={() =>
                                updateUserLock(user.clerkId, true)
                              }
                              title="Vô hiệu hóa người dùng"
                              // Thêm style cho con trỏ
                              style={{
                                cursor:
                                  updatingUserId === user.clerkId
                                    ? "wait"
                                    : "pointer",
                              }}
                            ></IoBanSharp>
                          ))}
                        
                        {/* Nút admin (luôn bị vô hiệu hóa) */}
                        {user.role == "admin" &&
                          (user.publicMetadata.locked ? (
                            <FaRegCircleCheck
                              className="manage-user-actions disable"
                              title="Hành động bị vô hiệu hóa"
                            ></FaRegCircleCheck>
                          ) : (
                            <IoBanSharp
                              className="manage-user-actions disable"
                              title="Hành động bị vô hiệu hóa"
                            ></IoBanSharp>
                          ))}
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      style={{ textAlign: "center", padding: "20px" }}
                    >
                      Không tồn tại người dùng.
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        <div className="manage-user-pagination">
          <button
            className="nav-btn"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              className={`page-btn ${currentPage === i + 1 ? "active" : ""}`}
              onClick={() => handlePageChange(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button
            className="nav-btn"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            ›
          </button>
        </div>
      </div>
    </>
  );
}

export default ManageUserPage;