import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Modal from 'react-modal';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

import Header from '../../components/Header';
import HeroSectionAdmin from '../../components/HeroSectionAdmin';
import { sendEmail } from '../../utils/sendEmail';

import { FaRegCircleCheck } from 'react-icons/fa6';
import { IoBanSharp } from 'react-icons/io5';
import { RiLoginCircleLine } from 'react-icons/ri';

import '../../css/ManageBusinessPage.css';

function ManageBusinessPage() {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState([]); 
  const [search, setSearch] = useState('');
  const [sortStatus, setSortStatus] = useState('Newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [banReason, setBanReason] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState(null); 
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [ownerNames, setOwnerNames] = useState({});

  const limit = 5; 
  Modal.setAppElement('#root');

  useEffect(() => {
    fetchBusinesses(sortStatus);
  }, [sortStatus]);

  const fetchBusinesses = async (sort) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BE_URL}/api/business/`,
        {
          params: { sort, limit: 1000 },
        }
      );

      const businessesData = res.data.businesses;
      setBusinesses(businessesData);
      const ownerIds = [...new Set(businessesData.map((b) => b.owner_id))];
      const ownerResponses = await Promise.all(
        ownerIds.map((id) =>
          axios.get(`${import.meta.env.VITE_BE_URL}/api/user/${id}`)
        )
      );

      const nameMap = {};
      ownerResponses.forEach((res) => {
        const user = res.data;
        if (user?.clerkId) nameMap[user.clerkId] = user.fullName;
      });

      setOwnerNames(nameMap);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch businesses or owner info');
    }
  };

  const updateBusinessStatus = async (businessId, name, newStatus) => {
    const loadingToastId = toast.loading(
      'Đang cập nhật trạng thái doanh nghiệp...'
    );

    try {
      await axios.put(
        `${import.meta.env.VITE_BE_URL}/api/business/${businessId}`, 
        {
          business_active: newStatus,
        }
      );

      setBusinesses((prevBusinesses) =>
        prevBusinesses.map((b) =>
          b._id === businessId ? { ...b, business_active: newStatus } : b
        )
      );

      toast.dismiss(loadingToastId);
      toast.success(
        `${
          newStatus === 'active' ? 'Kích hoạt' : 'Vô hiệu hóa'
        } doanh nghiệp "${name}" thành công!`
      );
    } catch (err) {
      console.error('PUT error:', err);
      toast.dismiss(loadingToastId);
      toast.error(`Không thể cập nhật trạng thái cho "${name}"`);
    }
  };

  const handleBan = (businessId, name) =>
    updateBusinessStatus(businessId, name, 'inactive');
  const handleActivate = (businessId, name) =>
    updateBusinessStatus(businessId, name, 'active');

  const handleBanPending = (businessId, name) => {
    setSelectedBusiness({ id: businessId, name });
    setIsBanModalOpen(true);
  };
  const handleEnterBusiness = (id) => navigate(`/business/${id}`); 

  const submitBanReason = async () => {
    if (!banReason.trim()) return toast.error('Vui lòng nhập lý do từ chối.');

    const { id, name } = selectedBusiness;
    const business = businesses.find((b) => b._id === id); 

    if (!business) return toast.error('Không tìm thấy doanh nghiệp.');

    const loadingToastId = toast.loading('Đang xử lý từ chối doanh nghiệp...');

    try {
      const userRes = await axios.get(
        `${import.meta.env.VITE_BE_URL}/api/user/${business.owner_id}`
      );

      const owner = userRes.data;

      if (!owner?.email || !owner?.fullName) {
        toast.dismiss(loadingToastId);
        return toast.error('Không tìm thấy thông tin người dùng.');
      }

      await sendEmail(import.meta.env.VITE_EMAILJS_TEMPLATE_REJECT_ID, {
        email: owner.email,
        owner_name: owner.fullName,
        subject: 'Doanh nghiệp bị từ chối phê duyệt',
        message_body: `
        <p>Chúng tôi xin thông báo rằng doanh nghiệp <strong>"${business.business_name}"</strong> của bạn đã <strong>không được phê duyệt</strong> trên nền tảng Local Assistant HOLA.</p>
        <p><strong>Lý do từ chối:</strong><br />${banReason}</p>
        <p>Nếu bạn cần hỗ trợ chỉnh sửa hoặc muốn gửi lại yêu cầu phê duyệt, vui lòng cập nhật lại thông tin doanh nghiệp trong hệ thống.</p>
      `,
      });

      await updateBusinessStatus(id, name, 'inactive'); 

      toast.dismiss(loadingToastId);
      toast.success(
        `Đã từ chối doanh nghiệp "${name}" và gửi email thành công`
      );

      setIsBanModalOpen(false);
      setBanReason('');
      setSelectedBusiness(null);
    } catch (err) {
      console.error(err);
      toast.dismiss(loadingToastId);
      if (err.response && err.config.url.includes('/api/user/')) {
        toast.error('Lỗi: Không tìm thấy thông tin chủ sở hữu.');
      } else {
        toast.error('Từ chối doanh nghiệp hoặc gửi email thất bại');
      }
    }
  };

  const filteredBusinesses = businesses.filter((b) => {
    const matchesSearch =
      b.business_name.toLowerCase().includes(search.toLowerCase()) ||
      b.owner_id.toLowerCase().includes(search.toLowerCase()) ||
      (ownerNames[b.owner_id] || '')
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesStatus = ['Active', 'Inactive', 'Pending'].includes(sortStatus)
      ? b.business_active === sortStatus.toLowerCase()
      : true;

    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.ceil(filteredBusinesses.length / limit);

  const paginatedBusinesses = filteredBusinesses.slice(
    (currentPage - 1) * limit,
    currentPage * limit
  );

  return (
    <>
      <Header />
      <HeroSectionAdmin
        message={
          <>
            Trang quản lý <br /> doanh nghiệp
          </>
        }
      />

      <Modal
        isOpen={isBanModalOpen}
        onRequestClose={() => setIsBanModalOpen(false)}
        contentLabel="Từ chối doanh nghiệp"
        style={{
          content: {
            maxWidth: '700px',
            maxHeight: '300px',
            margin: 'auto',
            padding: '20px',
            borderRadius: '10px',
            zIndex: 100
          },
          overlay: { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
        }}
      >
        <h2 className="business-ban-title">Từ chối doanh nghiệp</h2>
        <p>
          Nhập lý do từ chối doanh nghiệp{' '}
          <strong>"{selectedBusiness?.name}"</strong>:
        </p>
        <textarea
          value={banReason}
          onChange={(e) => setBanReason(e.target.value)}
          placeholder="Lý do từ chối..."
          rows={4}
          className="business-ban-text-area"
        ></textarea>

        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <button
            onClick={() => setIsBanModalOpen(false)}
            className="business-ban-modal-btn cancel"
          >
            Hủy
          </button>
          <button
            onClick={submitBanReason}
            className="business-ban-modal-btn confirm"
          >
            Xác nhận từ chối
          </button>
        </div>
      </Modal>

      <div className="manage-business-container">
        <div className="manage-business-table-header">
          <div className="manage-business-search-bar">
            <input
              type="text"
              placeholder="Tìm theo tên hoặc chủ doanh nghiệp"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="manage-business-sort-select">
            <select
              value={sortStatus}
              onChange={(e) => setSortStatus(e.target.value)}
            >
              <option value="Newest">Mới nhất</option>
              <option value="Oldest">Cũ nhất</option>
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
                <th>Tên doanh nghiệp</th>
                <th>Chủ doanh nghiệp</th>
                <th>Loại</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="wait">
                {/* --- THAY ĐỔI: Dùng paginatedBusinesses --- */}
                {paginatedBusinesses.map((b) => (
                  <motion.tr
                    key={b._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                  >
                    <td>{b.business_name}</td>
                    <td>{ownerNames[b.owner_id] || 'Loading...'}</td>
                    <td style={{textTransform: "capitalize"}}>{b.business_category_id?.category_name}</td>
                    <td>
                      <span
                        className={`manage-business-status ${b.business_active.toLowerCase()}`}
                      >
                        {b.business_active === 'active' && <p>Hoạt động</p>}
                        {b.business_active === 'pending' && (
                          <p>Chờ kiểm duyệt</p>
                        )}
                        {b.business_active === 'inactive' && <p>Bị khóa</p>}
                      </span>
                    </td>
                    <td className="manage-business-actions-icons">
                      {/* --- THAY ĐỔI: Sử dụng b._id thay vì i --- */}
                      {b.business_active === 'inactive' && (
                        <FaRegCircleCheck
                          className="manage-business-actions action-check"
                          onClick={() => handleActivate(b._id, b.business_name)}
                          title="Kích hoạt doanh nghiệp"
                        />
                      )}
                      {b.business_active === 'active' && (
                        <IoBanSharp
                          className="manage-business-actions action-ban"
                          onClick={() => handleBan(b._id, b.business_name)}
                          title="Vô hiệu hóa doanh nghiệp"
                        />
                      )}
                      {b.business_active === 'pending' && (
                        <>
                          <FaRegCircleCheck
                            className="manage-business-actions action-check"
                            onClick={() =>
                              handleActivate(b._id, b.business_name)
                            }
                            title="Chấp nhận doanh nghiệp"
                          />
                          <IoBanSharp
                            className="manage-business-actions action-ban"
                            onClick={() =>
                              handleBanPending(b._id, b.business_name)
                            }
                            title="Từ chối doanh nghiệp"
                          />
                        </>
                      )}
                      <RiLoginCircleLine
                        className="manage-business-actions enter"
                        onClick={() => handleEnterBusiness(b._id)}
                        title="Truy cập doanh nghiệp"
                      />
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* --- PHÂN TRANG FRONTEND --- */}
        <div className="manage-business-pagination">
          <button
            className="nav-btn"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
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
            disabled={currentPage === totalPages || totalPages === 0}
          >
            ›
          </button>
        </div>
      </div>
    </>
  );
}

export default ManageBusinessPage;
