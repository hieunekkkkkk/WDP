import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import '../../css/DashboardPage.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaPlusCircle, FaEdit, FaTrash } from 'react-icons/fa';

const BACKEND_URL = import.meta.env.VITE_BE_URL;

const formatDateForAPI = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateForInput = (date) => {
  return formatDateForAPI(date);
};

const formatChartDateLabel = (dateString) => {
  try {
    // eslint-disable-next-line no-unused-vars
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}`;
    // eslint-disable-next-line no-unused-vars
  } catch (e) {
    return '';
  }
};

const AddRevenueModal = ({ isOpen, onClose, businessId, onSuccess }) => {
  const [formData, setFormData] = useState({
    revenue_name: '',
    revenue_amount: '',
    revenue_description: '',
    revenue_date: formatDateForInput(new Date()),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (
      !formData.revenue_name ||
      !formData.revenue_amount ||
      !formData.revenue_date
    ) {
      toast.error('Vui lòng nhập Tên, Doanh thu và Ngày.');
      return;
    }

    const amount = Number(formData.revenue_amount);
    if (isNaN(amount) || amount < 0) {
      toast.error('Doanh thu không thể là số âm.');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post(
        `${BACKEND_URL}/api/business/${businessId}/business_revenue`,
        {
          ...formData,
          revenue_amount: amount,
        }
      );
      toast.success('Thêm doanh thu thành công!');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to add revenue:', err);
      toast.error(err.response?.data?.error || 'Lỗi khi thêm doanh thu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <form onSubmit={handleSubmit}>
          <h2>Thêm doanh thu mới</h2>
          <div className="form-group">
            <label htmlFor="revenue_name">Tên</label>
            <input
              type="text"
              id="revenue_name"
              name="revenue_name"
              value={formData.revenue_name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="revenue_amount">Doanh thu (VND)</label>
            <input
              type="number"
              id="revenue_amount"
              name="revenue_amount"
              value={formData.revenue_amount}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="revenue_date">Ngày/Tháng</label>
            <input
              type="date"
              id="revenue_date"
              name="revenue_date"
              value={formData.revenue_date}
              onChange={handleChange}
              max={formatDateForInput(new Date())}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="revenue_description">Mô tả</label>
            <textarea
              id="revenue_description"
              name="revenue_description"
              value={formData.revenue_description}
              onChange={handleChange}
            />
          </div>
          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary dashboard-btn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn-primary dashboard-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditRevenueModal = ({ isOpen, onClose, revenueId, onSuccess }) => {
  const [formData, setFormData] = useState({
    revenue_name: '',
    revenue_amount: '',
    revenue_description: '',
    revenue_date: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Lấy dữ liệu revenue cũ khi modal mở
  useEffect(() => {
    if (isOpen && revenueId) {
      setIsLoading(true);
      // Dùng API GET /:id/business_revenue (số ít)
      axios
        .get(`${BACKEND_URL}/api/business/${revenueId}/business_revenue`)
        .then((res) => {
          const data = res.data;
          setFormData({
            revenue_name: data.revenue_name || '',
            revenue_amount: data.revenue_amount || '',
            revenue_description: data.revenue_description || '',
            revenue_date: data.revenue_date
              ? formatDateForInput(new Date(data.revenue_date))
              : '',
          });
        })
        .catch((err) => {
          console.error('Failed to fetch revenue:', err);
          toast.error('Không thể tải dữ liệu để sửa');
          onClose();
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, revenueId, onClose]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 2. Gửi dữ liệu cập nhật
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (
      !formData.revenue_name ||
      !formData.revenue_amount ||
      !formData.revenue_date
    ) {
      toast.error('Vui lòng nhập Tên, Doanh thu và Ngày.');
      return;
    }

    const amount = Number(formData.revenue_amount);
    if (isNaN(amount) || amount < 0) {
      toast.error('Doanh thu không thể là số âm.');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.put(
        `${BACKEND_URL}/api/business/${revenueId}/business_revenue`,
        {
          ...formData,
          revenue_amount: amount,
        }
      );
      toast.success('Cập nhật doanh thu thành công!');
      onSuccess(); // Tải lại bảng
      onClose(); // Đóng modal
    } catch (err) {
      console.error('Failed to update revenue:', err);
      toast.error(err.response?.data?.error || 'Lỗi khi cập nhật doanh thu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {isLoading ? (
          <p>Đang tải dữ liệu...</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2>Sửa doanh thu</h2>
            <div className="form-group">
              <label htmlFor="revenue_name_edit">Tên</label>
              <input
                type="text"
                id="revenue_name_edit"
                name="revenue_name"
                value={formData.revenue_name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="revenue_amount_edit">Doanh thu (VND)</label>
              <input
                type="number"
                id="revenue_amount_edit"
                name="revenue_amount"
                value={formData.revenue_amount}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="revenue_date_edit">Ngày/Tháng</label>
              <input
                type="date"
                id="revenue_date_edit"
                name="revenue_date"
                value={formData.revenue_date}
                onChange={handleChange}
                max={formatDateForInput(new Date())}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="revenue_description_edit">Mô tả</label>
              <textarea
                id="revenue_description_edit"
                name="revenue_description"
                value={formData.revenue_description}
                onChange={handleChange}
              />
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary dashboard-btn"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn-primary dashboard-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const Pagination = ({ itemsPerPage, totalItems, paginate, currentPage }) => {
  const pageNumbers = [];
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const maxPagesToShow = 5;
  let startPage, endPage;
  if (totalPages <= maxPagesToShow) {
    startPage = 1;
    endPage = totalPages;
  } else {
    const maxPagesBeforeCurrent = Math.floor(maxPagesToShow / 2);
    const maxPagesAfterCurrent = Math.ceil(maxPagesToShow / 2) - 1;
    if (currentPage <= maxPagesBeforeCurrent) {
      startPage = 1;
      endPage = maxPagesToShow;
    } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
      startPage = totalPages - maxPagesToShow + 1;
      endPage = totalPages;
    } else {
      startPage = currentPage - maxPagesBeforeCurrent;
      endPage = currentPage + maxPagesAfterCurrent;
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="pagination-container">
      <nav>
        <ul className="pagination">
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <a onClick={() => paginate(1)} href="#!" className="page-link">
              «
            </a>
          </li>

          {pageNumbers.map((number) => (
            <li
              key={number}
              className={`page-item ${currentPage === number ? 'active' : ''}`}
            >
              <a
                onClick={() => paginate(number)}
                href="#!"
                className="page-link"
              >
                {number}
              </a>
            </li>
          ))}

          <li
            className={`page-item ${
              currentPage === totalPages ? 'disabled' : ''
            }`}
          >
            <a
              onClick={() => paginate(totalPages)}
              href="#!"
              className="page-link"
            >
              »
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
};

const PriorityTimer = ({ updatedAt }) => {
  const [remainingTime, setRemainingTime] = useState('');

  useEffect(() => {
    if (!updatedAt) return;

    const interval = setInterval(() => {
      const expirationTime = new Date(updatedAt).getTime() + 30 * 60 * 1000;
      const now = Date.now();
      const diff = expirationTime - now;

      if (diff <= 0) {
        setRemainingTime('Đã hết hạn');
        clearInterval(interval);
        return;
      }

      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setRemainingTime(
        `Còn lại: ${String(minutes).padStart(2, '0')} phút ${String(
          seconds
        ).padStart(2, '0')} giây`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [updatedAt]);

  if (!remainingTime) return null;

  return (
    <div
      className="stack-expiration-info"
      style={{
        marginBottom: '10px',
        fontSize: '14px',
        color: remainingTime === 'Đã hết hạn' ? '#dc3545' : '#28a745',
        fontWeight: '500',
      }}
    >
      {remainingTime}
    </div>
  );
};

const StackModal = ({
  isOpen,
  onClose,
  stack,
  onActivate,
  isActivating,
  businessInfo,
}) => {
  if (!isOpen) return null;

  if (!stack) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h2>Tăng ưu tiên hiển thị</h2>
          <p>Không tìm thấy thông tin gói "Tăng view". Vui lòng thử lại.</p>
          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary dashboard-btn"
              onClick={onClose}
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  }

  const hasPriority = businessInfo && businessInfo.business_priority > 0;
  let buttonText = isActivating ? 'Đang xử lý...' : '🔓 Kích hoạt gói này';
  if (hasPriority && !isActivating) {
    buttonText = `Đã mua ${businessInfo.business_priority} lần, mua thêm?`;
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content stack-modal-content">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onActivate(stack);
          }}
        >
          <h2>{stack.stack_name}</h2>
          <p>{stack.stack_detail}</p>
          <div
            className="stack-price"
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              margin: '15px 0',
              color: '#283593',
            }}
          >
            {Number(stack.stack_price).toLocaleString()}₫
          </div>

          {hasPriority && <PriorityTimer updatedAt={businessInfo.updated_at} />}

          <div
            className="modal-actions"
            style={{ flexDirection: 'column', justifyContent: 'center' }}
          >
            <button
              type="submit"
              className="stack-activate-btn"
              disabled={isActivating}
            >
              {buttonText}
            </button>
            <button
              type="button"
              className="stack-cancel-btn"
              onClick={onClose}
              disabled={isActivating}
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const [businessId, setBusinessId] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [loadingChart, setLoadingChart] = useState(true);
  const [endDate, setEndDate] = useState(new Date());
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d;
  });
  const [lineChartData, setLineChartData] = useState([]);
  const [isLoadingTable, setIsLoadingTable] = useState(true);
  const [appStatus, setAppStatus] = useState(
    'Đang tải thông tin người dùng...'
  );

  const [sortConfig, setSortConfig] = useState({
    key: 'revenue_date',
    direction: 'descending',
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [businessInfo, setBusinessInfo] = useState(null);
  const [isStackModalOpen, setIsStackModalOpen] = useState(false);
  const [tangViewStack, setTangViewStack] = useState(null);
  const [isActivating, setIsActivating] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRevenueId, setSelectedRevenueId] = useState(null);
  const { userId } = useAuth();

  useEffect(() => {
    if (userId) {
      setAppStatus('Đang tải thông tin business...');
      fetch(`${BACKEND_URL}/api/business/owner/${userId}`)
        .then((res) => {
          if (!res.ok) throw new Error('Không thể tải thông tin business.');
          return res.json();
        })
        .then((businesses) => {
          if (businesses && businesses.length > 0) {
            setBusinessId(businesses[0]._id);
            setBusinessInfo(businesses[0]);
            setAppStatus('');
          } else {
            setAppStatus('Không tìm thấy business nào cho tài khoản này.');
            setIsLoadingTable(false);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch business:', err);
          setAppStatus(`Lỗi: ${err.message}`);
          setIsLoadingTable(false);
        });
    } else {
      setAppStatus('Đang xác thực người dùng...');
    }
  }, [userId]);

  useEffect(() => {
    const fetchStackData = async () => {
      try {
        const stackRes = await axios.get(`${BACKEND_URL}/api/stack`);
        const data = stackRes.data;
        const stackList = Array.isArray(data) ? data : data.stacks || [];

        const priorityStack = stackList.find(
          (stack) =>
            stack.stack_name.toLowerCase().includes('tăng view') ||
            stack.stack_name.toLowerCase().includes('hiếu béo')
        );

        if (priorityStack) {
          setTangViewStack(priorityStack);
        } else {
          console.warn('Không tìm thấy gói "Tăng view"');
        }
      } catch (err) {
        console.error('Lỗi khi tải thông tin stack:', err);
      }
    };

    fetchStackData();
  }, []);

  const fetchTableData = () => {
    if (!businessId) return;
    setIsLoadingTable(true);

    fetch(`${BACKEND_URL}/api/business/${businessId}/business_revenues`)
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        setTableData(data);
      })
      .catch((err) => {
        console.error('Fetch table data error:', err);
        setTableData([]);
      })
      .finally(() => {
        setIsLoadingTable(false);
      });
  };

  const formatDateForAPI = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (!businessId) return;

    fetchTableData();

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 6);

    const endDateString = formatDateForAPI(endDate);
    const startDateString = formatDateForAPI(startDate);

    const last7DaysLabels = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(new Date().getDate() - i);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      last7DaysLabels.push({
        fullDate: formatDateForAPI(d),
        label: `${day}/${month}`,
      });
    }

    fetch(
      `${BACKEND_URL}/api/business/${businessId}/views?start=${startDateString}&end=${endDateString}`
    )
      .then((res) => {
        if (!res.ok) throw new Error('Không thể tải dữ liệu lượt xem');
        return res.json();
      })
      .then((apiData) => {
        const processedData = last7DaysLabels.map((dayInfo) => {
          const matchingDay = apiData.find((d) => d.date === dayInfo.fullDate);
          return {
            view_date: dayInfo.label,
            view_count: matchingDay ? matchingDay.views : 0,
          };
        });

        setWeeklyData(processedData);
      })
      .catch((err) => {
        console.error('Fetch weekly data error:', err);
        const errorData = last7DaysLabels.map((dayInfo) => ({
          view_date: dayInfo.label,
          view_count: 0,
        }));
        setWeeklyData(errorData);
      });
  }, [businessId]);

  useEffect(() => {
    if (!businessId) return;
    if (startDate > endDate) {
      alert('Ngày bắt đầu không thể sau ngày kết thúc.');
      return;
    }

    const fetchChartData = async () => {
      setLoadingChart(true);
      try {
        const start = formatDateForAPI(startDate);
        const end = formatDateForAPI(endDate);

        const res = await axios.get(
          `${BACKEND_URL}/api/business/${businessId}/business_revenues/range?start=${start}&end=${end}`
        );

        setLineChartData(res.data || []);
      } catch (err) {
        console.error('Failed to fetch chart data:', err);
        setLineChartData([]);
      } finally {
        setLoadingChart(false);
      }
    };

    fetchChartData();
  }, [businessId, startDate, endDate]);

  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsLoadingTable(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = event.target.result;
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          toast.error('File Excel rỗng!');
          return;
        }

        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];

          if (!row.revenue_name && !row.name) {
            throw new Error(`Cột 'revenue_name' có lỗi.`);
          }

          const amount = row.revenue_amount || row.amount;
          if (amount === undefined || isNaN(parseFloat(amount))) {
            throw new Error(`Cột 'revenue_amount' có lỗi.`);
          }

          if (row.revenue_date && isNaN(new Date(row.revenue_date).getTime())) {
            throw new Error(`Cột 'revenue_date' có lỗi.`);
          }
        }

        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(
          `${BACKEND_URL}/api/business/${businessId}/business_revenues/import`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Lỗi từ server');
        }

        const result = await res.json();
        toast.success(result.message);
        fetchTableData();
      } catch (err) {
        console.error('Error importing file:', err);
        toast.error(err.message);
      } finally {
        setIsLoadingTable(false);
        e.target.value = null;
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDeleteRevenue = async (revenueId) => {
    if (!revenueId) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa mục doanh thu này?')) {
      return;
    }

    try {
      const res = await axios.delete(
        `${BACKEND_URL}/api/business/${revenueId}/business_revenues`
      );

      toast.success(res.data.message || 'Xóa doanh thu thành công!');
      fetchTableData();
    } catch (err) {
      console.error('Failed to delete revenue:', err);
      toast.error(err.response?.data?.message || 'Lỗi khi xóa.');
    }
  };

  const handleActivateStack = useCallback(
    async (selectedStack) => {
      if (isActivating || !userId) return;
      try {
        setIsActivating(true);

        const be = import.meta.env.VITE_BE_URL || BACKEND_URL;

        if (!selectedStack?._id) {
          throw new Error('Thiếu thông tin gói đăng ký');
        }

        const paymentUrl = `${be}/api/payment`;
        const paymentData = {
          user_id: userId,
          stack_id: selectedStack._id,
          type: 'business',
        };

        const res = await axios.post(paymentUrl, paymentData);

        if (!res.data?.url) {
          throw new Error('Không nhận được link thanh toán từ máy chủ.');
        }

        window.location.href = res.data.url;
      } catch (err) {
        console.error('[DashboardPage] Payment initiation failed:', err);
        toast.error(err.message || 'Không thể khởi tạo thanh toán');
        setIsActivating(false);
      }
    },
    [userId, isActivating]
  );

  const sortedTableData = useMemo(() => {
    let sortableData = [...tableData];
    if (sortConfig.key) {
      sortableData.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'revenue_amount') {
          aValue = Number(aValue) || 0;
          bValue = Number(bValue) || 0;
        } else if (sortConfig.key === 'revenue_date') {
          aValue = new Date(aValue).getTime() || 0;
          bValue = new Date(bValue).getTime() || 0;
        } else if (sortConfig.key === 'revenue_name') {
          aValue = String(aValue || '').toLowerCase();
          bValue = String(bValue || '').toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [tableData, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? ' 🔼' : ' 🔽';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };
  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return 'N/A';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTableItems = sortedTableData.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(sortedTableData.length / itemsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber < 1) pageNumber = 1;
    if (pageNumber > totalPages) pageNumber = totalPages;
    setCurrentPage(pageNumber);
  };

  const handleOpenEditModal = (revenueId) => {
    setSelectedRevenueId(revenueId);
    setIsEditModalOpen(true);
  };

  const renderTableBody = () => {
    if (isLoadingTable) {
      return (
        <tr>
          <td colSpan="4" style={{ textAlign: 'center' }}>
            Đang tải dữ liệu...
          </td>
        </tr>
      );
    }
    if (appStatus && !businessId) {
      return (
        <tr>
          <td colSpan="4" style={{ textAlign: 'center' }}>
            {appStatus}
          </td>
        </tr>
      );
    }

    if (currentTableItems.length > 0) {
      return currentTableItems.map((row) => (
        <tr key={row._id}>
          <td>{row.revenue_name}</td>
          <td>{formatDate(row.revenue_date)}</td>
          <td>{formatCurrency(row.revenue_amount)}</td>
          <td>{row.revenue_description}</td>
          <td className="stock-action-buttons">
            <button
              className="stock-action-btn edit"
              onClick={() => handleOpenEditModal(row._id)}
            >
              <FaEdit />
            </button>
            <button
              className="stock-action-btn delete"
              onClick={() => handleDeleteRevenue(row._id)}
            >
              <FaTrash />
            </button>
          </td>
        </tr>
      ));
    }
    return (
      <tr>
        <td colSpan="5" style={{ textAlign: 'center' }}>
          Chưa có thông tin
        </td>
      </tr>
    );
  };

  const chartHeight = 150;
  const chartWidth = 400;
  const chartPaddingY = 25;
  const chartPaddingX = 40;

  let pointsString = `0,${chartHeight - chartPaddingY}`;
  let maxRevenue = 0;
  let chartPoints = [];

  if (lineChartData.length > 0) {
    maxRevenue = Math.max(1, ...lineChartData.map((d) => d.revenue));

    chartPoints = lineChartData.map((d, i) => {
      const x =
        chartPaddingX +
        (i / (lineChartData.length - 1 || 1)) *
          (chartWidth - chartPaddingX * 2);

      const y =
        chartHeight -
        chartPaddingY -
        (d.revenue / maxRevenue) * (chartHeight - chartPaddingY * 2);

      return { x, y, data: d };
    });

    pointsString = chartPoints.map((p) => `${p.x},${p.y}`).join(' ');
  }

  return (
    <>
      <ToastContainer autoClose={3000} />
      <AddRevenueModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        businessId={businessId}
        onSuccess={fetchTableData}
      />
      {createPortal(
        <EditRevenueModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          revenueId={selectedRevenueId}
          onSuccess={fetchTableData}
        />,
        document.body
      )}
      {createPortal(
        <StackModal
          isOpen={isStackModalOpen}
          onClose={() => setIsStackModalOpen(false)}
          stack={tangViewStack}
          onActivate={handleActivateStack}
          isActivating={isActivating}
          businessInfo={businessInfo}
        />,
        document.body
      )}
      <div className="business-card table-section">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
          }}
        >
          <h2 className="card-title" style={{ margin: 0 }}>
            Quản lý doanh thu
          </h2>
          <div className="table-actions">
            <button
              className="add-btn"
              onClick={() => setIsAddModalOpen(true)}
              disabled={!businessId}
            >
              Thêm doanh thu
            </button>
            <input
              type="file"
              id="file-upload"
              style={{ display: 'none' }}
              onChange={handleFileImport}
              accept=".xlsx, .xls"
              disabled={!businessId}
            />
            <button
              className="import-btn"
              onClick={() => document.getElementById('file-upload').click()}
              disabled={!businessId}
            >
              Thêm bằng Excel
            </button>
            <a
              href="/business_revenues.xlsx"
              download="business_revenues.xlsx"
              style={{ textDecoration: 'none' }}
            >
              <button
                className="import-btn"
                style={{
                  marginLeft: '10px',
                  backgroundColor: '#ffc107',
                  color: '#000',
                  fontWeight: '500',
                }}
              >
                Tải file doanh thu mẫu
              </button>
            </a>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th
                onClick={() => requestSort('revenue_name')}
                style={{ cursor: 'pointer' }}
              >
                Tên {getSortIndicator('revenue_name')}
              </th>
              <th
                onClick={() => requestSort('revenue_date')}
                style={{ cursor: 'pointer' }}
              >
                Ngày/Tháng {getSortIndicator('revenue_date')}
              </th>
              <th
                onClick={() => requestSort('revenue_amount')}
                style={{ cursor: 'pointer' }}
              >
                Doanh thu {getSortIndicator('revenue_amount')}
              </th>
              <th>Mô tả</th>
            </tr>
          </thead>
          <tbody>{renderTableBody()}</tbody>
        </table>
        {sortedTableData.length > itemsPerPage && (
          <Pagination
            itemsPerPage={itemsPerPage}
            totalItems={sortedTableData.length}
            paginate={paginate}
            currentPage={currentPage}
          />
        )}
      </div>

      {/* Biểu đồ */}
      <div className="business-card charts-section">
        <div className="chart-wrapper">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              minHeight: '38px',
            }}
          >
            <h3 className="card-title">Lượt truy cập trong tuần</h3>
            <button
              className="dashboard-btn"
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                marginRight: '8px',
              }}
              onClick={() => setIsStackModalOpen(true)}
              disabled={!tangViewStack}
              title="Tăng ưu tiên hiển thị"
            >
              <FaPlusCircle style={{ marginRight: '5px' }} />
              Tăng View
            </button>
          </div>
          <p></p>
          <div className="bar-chart">
            {weeklyData.map((item, index) => (
              <div key={index} className="bar-group">
                <span className="bar-label">{item.view_date}</span>
                <div className="bar-container">
                  <div
                    className="bar"
                    style={{ height: `${(item.view_count / 150) * 100}%` }}
                  ></div>
                </div>
                <span className="bar-count">{item.view_count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-wrapper">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              minHeight: '38px',
            }}
          >
            <h3 className="card-title">Doanh thu theo thời gian</h3>
          </div>
          <div
            className="date-picker-group"
            style={{ display: 'flex', gap: '10px', margin: '10px 0' }}
          >
            <div style={{ flex: 1 }}>
              <label
                htmlFor="start-date"
                style={{ fontSize: '12px', display: 'block' }}
              >
                Từ ngày
              </label>
              <input
                type="date"
                id="start-date"
                value={formatDateForInput(startDate)}
                onChange={(e) => setStartDate(new Date(e.target.value))}
                style={{ width: '100%', padding: '4px' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                htmlFor="end-date"
                style={{ fontSize: '12px', display: 'block' }}
              >
                Đến ngày
              </label>
              <input
                type="date"
                id="end-date"
                value={formatDateForInput(endDate)}
                onChange={(e) => setEndDate(new Date(e.target.value))}
                style={{ width: '100%', padding: '4px' }}
              />
            </div>
          </div>

          <div className="line-chart">
            {loadingChart ? (
              <div
                style={{
                  height: '150px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                Đang tải...
              </div>
            ) : lineChartData.length === 0 ? (
              <div
                style={{
                  height: '150px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                Không có dữ liệu
              </div>
            ) : (
              <svg
                width="100%"
                height="150"
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              >
                <polyline
                  points={pointsString}
                  fill="none"
                  stroke="#283593"
                  strokeWidth="2"
                />

                {chartPoints.map((point, i) => (
                  <React.Fragment key={i}>
                    <circle cx={point.x} cy={point.y} r="3" fill="#283593" />

                    <text
                      x={point.x}
                      y={point.y - 15}
                      fill="#333"
                      fontSize="10"
                      textAnchor="middle"
                    >
                      {formatCurrency(point.data.revenue)}
                    </text>

                    <text
                      x={point.x}
                      y={chartHeight - 5}
                      fill="#666"
                      fontSize="10"
                      textAnchor="middle"
                    >
                      {formatChartDateLabel(point.data.date)}
                    </text>
                  </React.Fragment>
                ))}
              </svg>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
