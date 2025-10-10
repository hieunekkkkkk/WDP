import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HeroSectionAdmin from '../../components/HeroSectionAdmin';
import Footer from '../../components/Footer';
import '../../css/ManageTransactionPage.css';
import { toast } from 'react-toastify';
import Chart from 'chart.js/auto';
import Header from '../../components/Header';
import { FaTrash, FaXmark } from "react-icons/fa6";
import LoadingScreen from '../../components/LoadingScreen';

function ManageTransactionPage() {
  const [payments, setPayments] = useState([]);
  const [stacks, setStacks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ sortBy: 'payment_date', sortOrder: 'desc' });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [userNames, setUserNames] = useState({});

  const monthlyChartRef = useRef(null);
  const categoryChartRef = useRef(null);
  const revenueChartRef = useRef(null);
  const monthlyChartInstance = useRef(null);
  const categoryChartInstance = useRef(null);
  const revenueChartInstance = useRef(null);

  useEffect(() => {
    const uniqueIds = [...new Set(payments.map(p => p.user_id))];
    const fetchUsers = async () => {
      const fetchedNames = {};
      await Promise.all(
        uniqueIds.map(async (id) => {
          try {
            const baseURL = import.meta.env.VITE_BE_URL;
            const res = await fetch(`${baseURL}/api/user/${id}`);
            const data = await res.json();
            fetchedNames[id] = data.users.fullName;
          } catch (err) {
            fetchedNames[id] = 'Unknown';
          }
        })
      );
      setUserNames(fetchedNames);
    };

    fetchUsers();
  }, [payments]);

  // Fetch dữ liệu từ APIs
  useEffect(() => {
    fetchAllData();
  }, [pagination.currentPage, sortConfig, startDate, endDate]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const baseURL = import.meta.env.VITE_BE_URL;

      // Build query parameters for payments
      let paymentsUrl = `${baseURL}/api/payment?page=${pagination.currentPage}&limit=10&sortBy=${sortConfig.sortBy}&sortOrder=${sortConfig.sortOrder}`;
      if (startDate) paymentsUrl += `&startDate=${startDate}`;
      if (endDate) paymentsUrl += `&endDate=${endDate}`;

      // Fetch payments with sorting and date filters
      const paymentsResponse = await fetch(paymentsUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        setPayments(paymentsData.data.payments || []);
        setPagination({
          currentPage: paymentsData.data.currentPage || 1,
          totalPages: paymentsData.data.totalPages || 1,
          totalItems: paymentsData.data.totalItems || 0
        });
      } else {
        throw new Error('Failed to fetch payments');
      }

      // Fetch stacks
      const stacksResponse = await fetch(`${baseURL}/api/stack`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (stacksResponse.ok) {
        const stacksData = await stacksResponse.json();
        setStacks(stacksData.stacks || []);
      }

      // Fetch categories  
      const categoriesResponse = await fetch(`${baseURL}/api/category`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData.categories || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  // Xóa giao dịch
  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Bạn có chắc muốn xóa giao dịch này?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const baseURL = import.meta.env.VITE_BE_URL;

      const response = await fetch(`${baseURL}/api/payment/${paymentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Xóa giao dịch thành công');
        setPayments(payments.filter(payment => payment._id !== paymentId));
      } else {
        throw new Error('Xóa giao dịch thất bại');
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error('Không thể xóa giao dịch');
    }
  };

  // Filter payments (only search, no sorting)
  const getFilteredPayments = () => {
    return payments.filter((payment) =>
      payment.transaction_id?.toLowerCase().includes(search.toLowerCase()) ||
      payment.user_id?.toLowerCase().includes(search.toLowerCase())
    );
  };

  const filteredPayments = getFilteredPayments();

  // Tính tổng giá trị giao dịch
  const getTotalValue = () => {
    const total = payments.reduce((sum, payment) => sum + payment.payment_amount, 0);
    return (total / 1000000).toFixed(1) + 'M';
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);

    return `${date.getUTCDate().toString().padStart(2, '0')}/${(date.getUTCMonth() + 1).toString().padStart(2, '0')
      }/${date.getUTCFullYear()} ${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')
      }`;
  };

  // Tạo dữ liệu thống kê cho charts
  const getMonthlyData = () => {
    const monthlyStats = {};
    payments.forEach(payment => {
      const month = new Date(payment.payment_date).getMonth();
      monthlyStats[month] = (monthlyStats[month] || 0) + 1;
    });

    const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    return months.map((month, index) => monthlyStats[index] || 0);
  };

  const getStackStats = () => {
    const stackStats = {};
    payments.forEach(payment => {
      const stackName = payment.payment_stack.stack_name;
      stackStats[stackName] = (stackStats[stackName] || 0) + 1;
    });
    return stackStats;
  };

  // Handle sort change
  const handleSortChange = (e) => {
    const [sortBy, sortOrder] = e.target.value.split(':');
    setSortConfig({ sortBy, sortOrder });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Handle date filter changes
  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Render charts
  useEffect(() => {
    if (loading || payments.length === 0) return;

    // Monthly transactions chart
    if (monthlyChartRef.current) {
      const ctx = monthlyChartRef.current.getContext('2d');

      if (monthlyChartInstance.current) {
        monthlyChartInstance.current.destroy();
      }

      const monthlyData = getMonthlyData();

      monthlyChartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
          datasets: [{
            label: 'Giao dịch',
            data: monthlyData,
            borderColor: '#E91E63',
            backgroundColor: 'rgba(233, 30, 99, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#E91E63',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: '#f1f3f4'
              },
              ticks: {
                color: '#6c757d'
              }
            },
            x: {
              grid: {
                display: false
              },
              ticks: {
                color: '#6c757d'
              }
            }
          }
        }
      });
    }

    // Stack statistics chart
    if (categoryChartRef.current) {
      const ctx = categoryChartRef.current.getContext('2d');

      if (categoryChartInstance.current) {
        categoryChartInstance.current.destroy();
      }

      const stackStats = getStackStats();
      const stackLabels = Object.keys(stackStats);
      const stackData = Object.values(stackStats);

      categoryChartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: stackLabels,
          datasets: [{
            data: stackData,
            backgroundColor: [
              '#4FC3F7',
              '#B52857',
              '#E3DB10',
              '#0288D1',
              '#0277BD'
            ],
            borderRadius: 5,
            borderSkipped: false,
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              grid: {
                color: '#f1f3f4'
              },
              ticks: {
                color: '#6c757d'
              }
            },
            y: {
              grid: {
                display: false
              },
              ticks: {
                color: '#6c757d'
              }
            }
          }
        }
      });
    }

    // Revenue chart
    if (revenueChartRef.current) {
      const ctx = revenueChartRef.current.getContext('2d');

      if (revenueChartInstance.current) {
        revenueChartInstance.current.destroy();
      }

      const revenueData = getStackRevenues().map(stack => ({
        name: stack.name,
        amount: payments
          .filter(p => p.payment_stack.stack_name === stack.name)
          .reduce((sum, p) => sum + p.payment_amount, 0)
      }));

      revenueChartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: revenueData.map(item => item.name),
          datasets: [{
            data: revenueData.map(item => item.amount),
            backgroundColor: [
              '#4FC3F7',
              '#B52857',
              '#E3DB10',
              '#0288D1',
              '#0277BD'
            ],
            borderRadius: 5,
            borderSkipped: false,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  return `${context.label}: ${formatCurrency(context.raw)}`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                display: false
              },
              ticks: {
                color: '#6c757d'
              }
            },
            y: {
              beginAtZero: true,
              grid: {
                color: '#f1f3f4'
              },
              ticks: {
                color: '#6c757d',
                callback: function (value) {
                  return formatCurrency(value);
                }
              }
            }
          }
        }
      });
    }

    return () => {
      if (monthlyChartInstance.current) {
        monthlyChartInstance.current.destroy();
      }
      if (categoryChartInstance.current) {
        categoryChartInstance.current.destroy();
      }
      if (revenueChartInstance.current) {
        revenueChartInstance.current.destroy();
      }
    };
  }, [payments, stacks, loading]);

  // Stack revenue data for bar chart
  const getStackRevenues = () => {
    const revenueData = {};
    payments.forEach(payment => {
      const stackName = payment.payment_stack.stack_name;
      revenueData[stackName] = (revenueData[stackName] || 0) + payment.payment_amount;
    });

    return Object.entries(revenueData)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 7)
      .map(([name, amount]) => ({
        name,
        height: Math.max(60, (amount / Math.max(...Object.values(revenueData))) * 200)
      }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  if (loading) {
    return (
      <>
        <Header />
        <HeroSectionAdmin message={<>Trang quản lý <br /> giao dịch</>} />
        <LoadingScreen />
      </>
    );
  }

  return (
    <>
      <Header />
      <HeroSectionAdmin message={<>Trang quản lý <br /> giao dịch</>} />

      <div className="manage-transaction-container">
        {/* Header với search và filter */}
        <div className="transaction-header">
          <div className="transaction-search-bar">
            <input
              type="text"
              placeholder="Tìm theo mã GD, user ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="total-value">
            Tổng giá trị: {getTotalValue()} VND
          </div>
        </div>
        <div className="transaction-filter-section">
          <div className="date-filter">
            <label>Từ ngày:</label>
            <div className="date-input-wrapper">
              <input
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
              />
              {startDate && (
                <span
                  type="button"
                  className="clear-date-btn"
                  onClick={() => {
                    setStartDate('');
                    setPagination(prev => ({ ...prev, currentPage: 1 }));
                  }}
                  aria-label="Xoá ngày bắt đầu"
                >
                  <FaXmark />
                </span>
              )}
            </div>

            <label>Đến ngày:</label>
            <div className="date-input-wrapper">
              <input
                type="date"
                value={endDate}
                onChange={handleEndDateChange}
              />
              {endDate && (
                <span
                  type="button"
                  className="clear-date-btn"
                  onClick={() => {
                    setEndDate('');
                    setPagination(prev => ({ ...prev, currentPage: 1 }));
                  }}
                  aria-label="Xoá ngày kết thúc"
                >
                  <FaXmark />
                </span>
              )}
            </div>
          </div>
          <div className="sort-select">
            <label>Sắp xếp:</label>
            <select value={`${sortConfig.sortBy}:${sortConfig.sortOrder}`} onChange={handleSortChange}>
              <option value="payment_date:desc">Mới nhất</option>
              <option value="payment_date:asc">Cũ nhất</option>
              <option value="payment_amount:desc">Giá trị cao nhất</option>
              <option value="payment_amount:asc">Giá trị thấp nhất</option>
            </select>
          </div>
        </div>

        {/* Bảng giao dịch với hiệu ứng fade */}
        <AnimatePresence>
          <motion.div
            key={pagination.currentPage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="transaction-table-container"
          >
            <table className="transaction-table">
              <thead>
                <tr>
                  <th>Mã GD</th>
                  <th>User ID</th>
                  <th>Giá trị</th>
                  <th>Ngày/Giờ</th>
                  <th>Gói dịch vụ</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment._id}>
                    <td data-label="Mã GD">
                      <span className="tx-id">{payment.transaction_id}</span>
                    </td>
                    <td data-label="User ID">
                      {userNames[payment.user_id] || 'Loading...'}
                    </td>
                    <td data-label="Giá trị">
                      <span className="transaction-amount">
                        {formatCurrency(payment.payment_amount)}
                      </span>
                    </td>
                    <td data-label="Ngày/Giờ">{formatDate(payment.payment_date)}</td>
                    <td data-label="Gói dịch vụ">{payment.payment_stack.stack_name}</td>
                    <td data-label="Trạng thái">
                      <span className={`status ${payment.payment_status === 'completed' ? 'status-open' :
                        payment.payment_status === 'pending' ? 'status-busy' : 'status-closed'}`}>
                        {payment.payment_status === 'completed' ? 'Hoàn thành' :
                          payment.payment_status === 'pending' ? 'Đang xử lý' : 'Thất bại'}
                      </span>
                    </td>
                    <td data-label="Hành động" className="delete-button">
                      <FaTrash onClick={() => handleDeletePayment(payment._id)} />
                    </td>
                  </tr>
                ))}
                {filteredPayments.length === 0 && (
                  <tr>
                    <td colSpan="7" className="no-data">
                      Không tìm thấy giao dịch phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </motion.div>
        </AnimatePresence>

        {/* Phân trang */}
        <div className="transaction-pagination">
          {pagination.currentPage > 1 && (
            <span onClick={() => handlePageChange(pagination.currentPage - 1)}>
              &lt;
            </span>
          )}

          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
            <span
              key={page}
              className={pagination.currentPage === page ? 'page-active' : ''}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </span>
          ))}

          {pagination.currentPage < pagination.totalPages && (
            <span onClick={() => handlePageChange(pagination.currentPage + 1)}>
              &gt;
            </span>
          )}
        </div>

        {/* Phần biểu đồ */}
        <div className="charts-section">
          {/* Biểu đồ giao dịch hàng tháng */}
          <div className="chart-container">
            <h3 className="chart-title">Giao dịch hàng tháng</h3>
            <p className="chart-subtitle">
              Thống kê lượng giao dịch hàng tháng<br />của hệ thống
            </p>
            <div className="chart-wrapper">
              <canvas ref={monthlyChartRef}></canvas>
            </div>
          </div>

          {/* Thống kê gói dịch vụ */}
          <div className="chart-container">
            <h3 className="chart-title">Thống kê giao dịch theo gói dịch vụ</h3>
            <p className="chart-subtitle">Các gói dịch vụ phổ biến nhất</p>
            <div className="chart-wrapper">
              <canvas ref={categoryChartRef}></canvas>
            </div>

            <div className="legend">
              {stacks.map((stack, index) => (
                <div key={stack._id} className="legend-item">
                  <div
                    className="legend-color"
                    style={{
                      background: ['#4FC3F7', '#B52857', '#E3DB10', '#0288D1', '#0277BD'][index % 5]
                    }}
                  ></div>
                  <span>{stack.stack_name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Biểu đồ doanh thu theo gói */}
        <div className="business-revenue-section">
          <div className="revenue-chart-header">
            <h3 className="revenue-chart-title">
              📊 Top gói dịch vụ có doanh thu cao nhất
            </h3>
          </div>

          <div className="chart-container">
            <div className="chart-wrapper">
              <canvas ref={revenueChartRef}></canvas>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ManageTransactionPage;