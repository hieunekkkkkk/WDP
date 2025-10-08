import React, { useEffect, useState } from 'react';
import '../../css/DashboardPage.css';

const DashboardPage = () => {
  const [tableData, setTableData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);

  useEffect(() => {
    // Fetch doanh thu/lợi nhuận/chi phí
    fetch('/api/businessRevenue')
      .then((res) => res.json())
      .then((data) => setTableData(data))
      .catch(() => setTableData([]));

    // Fetch lượt truy cập tuần
    fetch('/api/businessView/weekly')
      .then((res) => res.json())
      .then((data) => setWeeklyData(data))
      .catch(() => setWeeklyData([]));

    // Fetch giao dịch tháng
    fetch('/api/businessRevenue/monthly')
      .then((res) => res.json())
      .then((data) => setMonthlyData(data))
      .catch(() => setMonthlyData([]));
  }, []);

  return (
    <>
      {/* Bảng dữ liệu */}
      <div className="business-card table-section">
        <h2 className="card-title">Quản lý</h2>
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
      <div className="business-card charts-section">
        <div className="chart-wrapper">
          <h3 className="card-title">Lượt truy cập trong tuần </h3>
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
