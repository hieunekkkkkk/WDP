import React, { useState, useEffect } from 'react';
import HeroSectionAdmin from '../../components/HeroSectionAdmin';
import Footer from '../../components/Footer';
import Header from '../../components/Header';
import '../../css/ManageUserPage.css';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { FaRegCircleCheck } from "react-icons/fa6";
import { IoBanSharp } from "react-icons/io5";
import { getCurrentUserId } from '../../utils/useCurrentUserId';


function ManageUserPage() {
  const currentUserId = getCurrentUserId();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [sortStatus, setSortStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const limit = 5;

  useEffect(() => {
    fetchUsers(currentPage);
  }, [currentPage]);

  const fetchUsers = async (page) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BE_URL}/api/user`, {
        params: { page, limit }
      });
      setUsers(res.data.users);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải danh sách người dùng');
    }
  };

  const filteredUsers = users.filter((user) =>
    (user.fullName.toLowerCase().includes(search.toLowerCase()) ||
      user.id.toLowerCase().includes(search.toLowerCase())) &&
    (sortStatus === 'All' || (user.publicMetadata.locked ?? false) === (sortStatus === 'true'))
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const updateUserLock = async (userId, lock) => {
    const loadingId = toast.loading(lock ? 'Đang khóa người dùng…' : 'Đang mở khóa người dùng…');
    try {
      const endpoint = lock
        ? `${import.meta.env.VITE_BE_URL}/api/user/${userId}/lock`
        : `${import.meta.env.VITE_BE_URL}/api/user/${userId}/unlock`;

      await axios.put(endpoint);

      toast.dismiss(loadingId);
      toast.success(lock ? 'Đã khóa người dùng' : 'Đã mở khóa người dùng');
      fetchUsers(currentPage);
    } catch (error) {
      toast.dismiss(loadingId);
      toast.error(lock ? 'Không thể khóa người dùng' : 'Không thể mở khóa người dùng');
    }
  };

  return (
    <>
      <Header />
      <HeroSectionAdmin message={<>Trang quản lý <br /> người dùng</>} />

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
          <div className="manage-user-sort-select">
            <select value={sortStatus} onChange={(e) => setSortStatus(e.target.value)}>
              <option value="All">Tất cả</option>
              <option value="false">Hoạt động</option>
              <option value="true">Bị Khóa</option>
            </select>
          </div>
        </div>

        <div className='manage-user-table-container'>
          <table className='manage-user-table'>
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
                  filteredUsers.map((user) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                    >
                      <td>
                        <img
                          src={user.imageUrl}
                          alt={user.fullName}
                          style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                        />
                      </td>
                      <td>{user.fullName}</td>
                      <td>{user.email}</td>
                      <td className='manage-user-table-role'>{user.publicMetadata.role}</td>
                      <td>
                        {user.publicMetadata.locked ? (
                          <span className="manage-user-status inactive">Bị khóa</span>
                        ) : (
                          <span className="manage-user-status active">Hoạt động</span>
                        )}
                      </td>
                      <td>
                        {user.id !== currentUserId && (user.publicMetadata.locked ? (
                          <FaRegCircleCheck className="manage-user-actions action-active" onClick={() => updateUserLock(user.id, false)} title='Kích hoạt người dùng'></FaRegCircleCheck>
                        ) : (
                          <IoBanSharp className="manage-user-actions action-inactive" onClick={() => updateUserLock(user.id, true)} title='Vô hiệu hóa người dùng'></IoBanSharp>
                        ))}
                        {user.id === currentUserId && (user.publicMetadata.locked ? (
                          <FaRegCircleCheck className="manage-user-actions disable" title='Hành động bị vô hiệu hóa'></FaRegCircleCheck>
                        ) : (
                          <IoBanSharp className="manage-user-actions disable" title='Hành động bị vô hiệu hóa'></IoBanSharp>
                        ))}
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                      Không tồn tại người dùng.
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        <div className="manage-user-pagination">
          <button className="nav-btn" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
            &lt;
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
              onClick={() => handlePageChange(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button className="nav-btn" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
            &gt;
          </button>
        </div>
      </div>
    </>
  );
}

export default ManageUserPage;