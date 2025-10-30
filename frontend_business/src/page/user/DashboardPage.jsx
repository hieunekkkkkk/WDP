import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import '../../css/DashboardPage.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const BACKEND_URL = 'http://localhost:3000';

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
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}`;
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

    setIsSubmitting(true);
    try {
      await axios.post(
        `${BACKEND_URL}/api/business/${businessId}/business_revenue`,
        {
          ...formData,
          revenue_amount: Number(formData.revenue_amount),
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

  // Tách hàm fetch data
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

  // Lấy dữ liệu dashboard
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

  // Xử lý khi người dùng chọn file Excel
  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file || !businessId) {
      if (!businessId) alert('Lỗi: Không tìm thấy ID của business.');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    try {
      setIsLoadingTable(true);

      const res = await fetch(
        `${BACKEND_URL}/api/business/${businessId}/business_revenues/import`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          `Import file thất bại (HTTP ${res.status}): ${
            errorData.error || 'Route not found'
          }`
        );
      }

      const result = await res.json();
      alert(result.message);
      fetchTableData();
    } catch (err) {
      console.error('Error importing file:', err);
      alert(err.message);
      setIsLoadingTable(false);
    } finally {
      e.target.value = null;
    }
  };

  const handleDeleteRevenue = async (revenueId) => {
    if (!revenueId) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa mục doanh thu này?')) {
      return;
    }

    try {
      // !! GIẢ ĐỊNH: Bạn cần TẠO API NÀY ở backend
      // !! DELETE /api/business/:businessId/business_revenue/:revenueId
      await axios.delete(
        `${BACKEND_URL}/api/business/${businessId}/business_revenue/${revenueId}`
      );
      toast.success('Xóa doanh thu thành công!');
      fetchTableData();
    } catch (err) {
      console.error('Failed to delete revenue:', err);
      toast.error(
        err.response?.data?.error ||
          'Lỗi khi xóa. API backend có thể chưa được tạo.'
      );
    }
  };

  const sortedTableData = useMemo(() => {
    let sortableData = [...tableData];
    if (sortConfig.key) {
      sortableData.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Xử lý theo từng loại key
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

        // So sánh
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

    if (sortedTableData.length > 0) {
      return sortedTableData.map((row) => (
        <tr key={row._id}>
          <td>{row.revenue_name}</td>
          <td>{formatDate(row.revenue_date)}</td>
          <td>{formatCurrency(row.revenue_amount)}</td>
          <td>{row.revenue_description}</td>
          <td>
            <button
              className="delete-btn"
              onClick={() => handleDeleteRevenue(row._id)}
            >
              Xóa
            </button>
          </td>
        </tr>
      ));
    }
    return (
      <tr>
        <td colSpan="4" style={{ textAlign: 'center' }}>
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
              + Add revenue
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
              Import Excel
            </button>
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
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>{renderTableBody()}</tbody>
        </table>
      </div>

      {/* Biểu đồ */}
      <div className="business-card charts-section">
        <div className="chart-wrapper">
          <h3 className="card-title">Lượt truy cập trong tuần</h3>
          <p> </p>
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
          <h3 className="card-title">Doanh thu theo thời gian</h3>
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
