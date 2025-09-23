import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import '../../css/DashboardPage.css';

const DashboardPage = () => {
  const tableData = [
    {
      date: '2025-06-05',
      revenue: '100,000 VND',
      profit: 'Lorem ipsum',
      cost: 'Chỉ tiết',
    },
    {
      date: '2025-06-05',
      revenue: '100,000 VND',
      profit: 'Lorem ipsum',
      cost: 'Chỉ tiết',
    },
    {
      date: '2025-06-05',
      revenue: '100,000 VND',
      profit: 'Lorem ipsum',
      cost: 'Chỉ tiết',
    },
    {
      date: '2025-06-12',
      revenue: '100,000 VND',
      profit: 'Lorem ipsum',
      cost: 'Chỉ tiết',
    },
    {
      date: '2025-06-05',
      revenue: '100,000 VND',
      profit: 'Lorem ipsum',
      cost: 'Chỉ tiết',
    },
    {
      date: '2025-06-05',
      revenue: '100,000 VND',
      profit: 'Lorem ipsum',
      cost: 'Chỉ tiết',
    },
  ];

  const weeklyData = [
    { day: 'Mon', value: 150 },
    { day: 'Tue', value: 90 },
    { day: 'Wed', value: 74 },
    { day: 'Thu', value: 150 },
    { day: 'Fri', value: 120 },
    { day: 'Sat', value: 80 },
    { day: 'Sun', value: 100 },
  ];

  const monthlyData = [
    { month: 'Jan', value: 25 },
    { month: 'Feb', value: 28 },
    { month: 'Mar', value: 20 },
    { month: 'Apr', value: 27 },
    { month: 'May', value: 26 },
    { month: 'Jun', value: 29 },
  ];

  return (
    <div className="dashboard-page">
      <Header />
      <main className="dashboard-content">
        {/* Nội dung chính */}
        <div className="main-content">
          {/* Bảng dữ liệu */}
          <div className="table-section">
            <h2>Quản lý</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ngày/Tháng</th>
                  <th>Doanh Thu</th>
                  <th>Lãi</th>
                  <th>Chi phí</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, index) => (
                  <tr key={index}>
                    <td>{row.date}</td>
                    <td>{row.revenue}</td>
                    <td>{row.profit}</td>
                    <td>{row.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Biểu đồ */}
          <div className="charts-section">
            <div className="chart-wrapper">
              <h3>Lượt truy cập trong tuần</h3>
              <div className="bar-chart">
                {weeklyData.map((item, index) => (
                  <div key={index} className="bar-group">
                    <span className="bar-label">{item.day}</span>
                    <div className="bar-container">
                      <div
                        className="bar"
                        style={{ height: `${(item.value / 150) * 100}%` }}
                      >
                        {item.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="chart-wrapper">
              <h3>Giao dịch hàng tháng</h3>
              <p>Thống kê giao dịch hàng tháng</p>
              <div className="line-chart">
                <svg width="100%" height="150" viewBox="0 0 400 150">
                  <polyline
                    points={monthlyData
                      .map((d, i) => `${i * 60 + 30},${150 - d.value * 5}`)
                      .join(' ')}
                    fill="none"
                    stroke="red"
                    strokeWidth="2"
                  />
                  {/* Điểm dữ liệu */}
                  {monthlyData.map((d, i) => (
                    <circle
                      key={i}
                      cx={i * 60 + 30}
                      cy={150 - d.value * 5}
                      r="3"
                      fill="red"
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
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DashboardPage;
