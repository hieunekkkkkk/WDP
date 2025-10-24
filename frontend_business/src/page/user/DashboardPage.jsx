import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import '../../css/DashboardPage.css';

const BACKEND_URL = 'http://localhost:3000';

const DashboardPage = () => {
  const [businessId, setBusinessId] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [isLoadingTable, setIsLoadingTable] = useState(true);
  const [appStatus, setAppStatus] = useState(
    'Đang tải thông tin người dùng...'
  );

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
    if (tableData.length > 0) {
      return tableData.map((row, index) => (
        <tr key={row._id || index}>
          <td>{row.revenue_name}</td>
          <td>{formatDate(row.revenue_date)}</td>
          <td>{formatCurrency(row.revenue_amount)}</td>
          <td>{row.revenue_description}</td>
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

  return (
    <>
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
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              background: '#283593',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
            }}
            disabled={!businessId}
          >
            Import Excel
          </button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Tên</th>
              <th>Ngày/Tháng</th>
              <th>Doanh thu</th>
              <th>Mô tả</th>
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
          <h3 className="card-title">Giao dịch hàng tháng</h3>
          <p>Thống kê giao dịch hàng tháng</p>
          <div className="line-chart">
            <svg width="100%" height="150" viewBox="0 0 400 150">
              <polyline
                points={monthlyData
                  .map((d, i) => `${i * 60 + 30},${150 - d.value * 5}`)
                  .join(' ')}
                fill="none"
                stroke="#283593"
                strokeWidth="2"
              />
              {monthlyData.map((d, i) => (
                <circle
                  key={i}
                  cx={i * 60 + 30}
                  cy={150 - d.value * 5}
                  r="3"
                  fill="#283593"
                />
              ))}
            </svg>
            <div className="months-label">
              {monthlyData.map((d, i) => (
                <span key={i} style={{ left: `${i * 16.67}%` }}>
                  {d.month}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;
