<<<<<<< HEAD
import React from "react";
import "../../css/DashboardPage.css";

const DashboardPage = () => {
  const tableData = [
    {
      date: "2025-06-05",
      revenue: "100,000 VND",
      profit: "Lorem ipsum",
      cost: "Chi tiết",
    },
    {
      date: "2025-06-05",
      revenue: "100,000 VND",
      profit: "Lorem ipsum",
      cost: "Chi tiết",
    },
    {
      date: "2025-06-05",
      revenue: "100,000 VND",
      profit: "Lorem ipsum",
      cost: "Chi tiết",
    },
    {
      date: "2025-06-12",
      revenue: "100,000 VND",
      profit: "Lorem ipsum",
      cost: "Chi tiết",
    },
    {
      date: "2025-06-05",
      revenue: "100,000 VND",
      profit: "Lorem ipsum",
      cost: "Chi tiết",
    },
    {
      date: "2025-06-05",
      revenue: "100,000 VND",
      profit: "Lorem ipsum",
      cost: "Chi tiết",
    },
  ];

  const weeklyData = [
    { day: "Mon", value: 150 },
    { day: "Tue", value: 90 },
    { day: "Wed", value: 74 },
    { day: "Thu", value: 150 },
    { day: "Fri", value: 120 },
    { day: "Sat", value: 80 },
    { day: "Sun", value: 100 },
  ];

  const monthlyData = [
    { month: "Jan", value: 25 },
    { month: "Feb", value: 28 },
    { month: "Mar", value: 20 },
    { month: "Apr", value: 27 },
    { month: "May", value: 26 },
    { month: "Jun", value: 29 },
  ];
=======
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
>>>>>>> origin/hieu

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
<<<<<<< HEAD
          <h3 className="card-title">Lượt truy cập trong tuần</h3>
=======
          <h3 className="card-title">Lượt truy cập trong tuần </h3>
>>>>>>> origin/hieu
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
<<<<<<< HEAD
                  .join(" ")}
=======
                  .join(' ')}
>>>>>>> origin/hieu
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
