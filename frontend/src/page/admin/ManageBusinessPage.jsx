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
  const [totalPages, setTotalPages] = useState(1);
  const [banReason, setBanReason] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [ownerNames, setOwnerNames] = useState({});

  const limit = 5;
  Modal.setAppElement('#root');

  useEffect(() => {
    fetchBusinesses(currentPage, sortStatus);
  }, [currentPage, sortStatus]);

  const fetchBusinesses = async (page, sort) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BE_URL}/api/business/`, {
        params: { page, limit, sort }
      });

      const businessesData = res.data.businesses;
      setBusinesses(businessesData);
      setTotalPages(res.data.totalPages);

      const ownerIds = [...new Set(businessesData.map((b) => b.owner_id))];
      const ownerResponses = await Promise.all(
        ownerIds.map((id) => axios.get(`${import.meta.env.VITE_BE_URL}/api/user/${id}`))
      );

      const nameMap = {};
      ownerResponses.forEach((res) => {
        const user = res.data.users;
        if (user?.id) nameMap[user.id] = user.fullName;
      });

      setOwnerNames(nameMap);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch businesses or owner info');
    }
  };

  const updateBusinessStatus = async (index, name, newStatus) => {
    const loadingToastId = toast.loading('Đang cập nhật trạng thái doanh nghiệp...');

    try {
      const business = businesses[index];
      await axios.put(`${import.meta.env.VITE_BE_URL}/api/business/${business._id}`, {
        business_active: newStatus
      });

      const updated = [...businesses];
      updated[index].business_active = newStatus;
      setBusinesses(updated);

      toast.dismiss(loadingToastId);
      toast.success(`${newStatus === 'active' ? 'Kích hoạt' : 'Vô hiệu hóa'} doanh nghiệp "${name}" thành công!`);
    } catch (err) {
      console.error('PUT error:', err);
      toast.dismiss(loadingToastId);
      toast.error(`Không thể cập nhật trạng thái cho "${name}"`);
    }
  };

  const handleBan = (index, name) => updateBusinessStatus(index, name, 'inactive');
  const handleActivate = (index, name) => updateBusinessStatus(index, name, 'active');
  const handleBanPending = (index, name) => {
    setSelectedBusiness({ index, name });
    setIsBanModalOpen(true);
  };
  const handleEnterBusiness = (index, id) => navigate(`/business/${id}`);

  const submitBanReason = async () => {
    if (!banReason.trim()) return toast.error('Vui lòng nhập lý do từ chối.');

    const { index, name } = selectedBusiness;
    const business = businesses[index];

    const loadingToastId = toast.loading('Đang xử lý từ chối doanh nghiệp...');

    try {
      const userRes = await axios.get(`${import.meta.env.VITE_BE_URL}/api/user/${business.owner_id}`);
      const owner = userRes.data.users;

      if (!owner?.email || !owner?.fullName) {
        toast.dismiss(loadingToastId);
        return toast.error('Không tìm thấy thông tin người dùng.');
      }

      console.log(owner.email, owner.fullName);
      

      await sendEmail(import.meta.env.VITE_EMAILJS_TEMPLATE_REJECT_ID, {
        email: owner.email,
        owner_name: owner.fullName,
        subject: 'Doanh nghiệp bị từ chối phê duyệt',
        message_body: `
        <p>Chúng tôi xin thông báo rằng doanh nghiệp <strong>"${business.business_name}"</strong> của bạn đã <strong>không được phê duyệt</strong> trên nền tảng Local Link.</p>
        <p><strong>Lý do từ chối:</strong><br />${banReason}</p>
        <p>Nếu bạn cần hỗ trợ chỉnh sửa hoặc muốn gửi lại yêu cầu phê duyệt, vui lòng cập nhật lại thông tin doanh nghiệp trong hệ thống.</p>
      `,
      });

      await updateBusinessStatus(index, name, 'inactive');

      toast.dismiss(loadingToastId);
      toast.success(`Đã từ chối doanh nghiệp "${name}" và gửi email thành công`);

      setIsBanModalOpen(false);
      setBanReason('');
      setSelectedBusiness(null);
    } catch (err) {
      console.error(err);
      toast.dismiss(loadingToastId);
      toast.error('Từ chối doanh nghiệp hoặc gửi email thất bại');
    }
  };


  const filteredBusinesses = businesses.filter((b) => {
    const matchesSearch = b.business_name.toLowerCase().includes(search.toLowerCase()) ||
      b.owner_id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = ['Active', 'Inactive', 'Pending'].includes(sortStatus)
      ? b.business_active === sortStatus.toLowerCase()
      : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <Header />
      <HeroSectionAdmin message={<>Trang quản lý <br /> doanh nghiệp</>} />

      <Modal
        isOpen={isBanModalOpen}
        onRequestClose={() => setIsBanModalOpen(false)}
        contentLabel="Từ chối doanh nghiệp"
        style={{
          content: { maxWidth: '700px', maxHeight: '300px', margin: 'auto', padding: '20px', borderRadius: '10px' },
          overlay: { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
        }}
      >
        <h2 className='business-ban-title'>Từ chối doanh nghiệp</h2>
        <p>Nhập lý do từ chối doanh nghiệp <strong>"{selectedBusiness?.name}"</strong>:</p>
        <textarea
          value={banReason}
          onChange={(e) => setBanReason(e.target.value)}
          placeholder="Lý do từ chối..."
          rows={4}
          className='business-ban-text-area'
        ></textarea>

        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <button onClick={() => setIsBanModalOpen(false)} className="business-ban-modal-btn cancel">Hủy</button>
          <button onClick={submitBanReason} className="business-ban-modal-btn confirm">Xác nhận từ chối</button>
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
            <label>Sắp xếp:</label>
            <select value={sortStatus} onChange={(e) => setSortStatus(e.target.value)}>
              <option value="Newest">Mới nhất</option>
              <option value="Oldest">Cũ nhất</option>
              <option value="Active">Kích hoạt</option>
              <option value="Inactive">Vô hiệu hóa</option>
              <option value="Pending">Tạm chờ</option>
            </select>
          </div>
        </div>

        <div className='manage-business-table-container'>
          <table className='manage-business-table'>
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
                {filteredBusinesses.map((b, i) => (
                  <motion.tr
                    key={b._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                  >
                    <td>{b.business_name}</td>
                    <td>{ownerNames[b.owner_id] || b.owner_id}</td>
                    <td>{b.business_category_id?.category_name}</td>
                    <td>
                      <span className={`manage-business-status ${b.business_active.toLowerCase()}`}>
                        {b.business_active === 'active' && <p>Hoạt động</p>}
                        {b.business_active === 'pending' && <p>Chờ kiểm duyệt</p>}
                        {b.business_active === 'inactive' && <p>Bị khóa</p>}
                      </span>
                    </td>
                    <td className='manage-business-actions-icons'>
                      {b.business_active === 'inactive' && (
                        <FaRegCircleCheck className="manage-business-actions action-check" onClick={() => handleActivate(i, b.business_name)} title="Kích hoạt doanh nghiệp" />
                      )}
                      {b.business_active === 'active' && (
                        <IoBanSharp className="manage-business-actions action-ban" onClick={() => handleBan(i, b.business_name)} title="Vô hiệu hóa doanh nghiệp" />
                      )}
                      {b.business_active === 'pending' && (
                        <>
                          <FaRegCircleCheck className="manage-business-actions action-check" onClick={() => handleActivate(i, b.business_name)} title="Chấp nhận doanh nghiệp" />
                          <IoBanSharp className="manage-business-actions action-ban" onClick={() => handleBanPending(i, b.business_name)} title="Từ chối doanh nghiệp" />
                        </>
                      )}
                      <RiLoginCircleLine className="manage-business-actions enter" onClick={() => handleEnterBusiness(i, b._id)} title="Truy cập doanh nghiệp" />
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        <div className="manage-business-pagination">
          <button className="nav-btn" onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
            &lt;
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
          <button className="nav-btn" onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
            &gt;
          </button>
        </div>
      </div>
    </>
  );
}

export default ManageBusinessPage;