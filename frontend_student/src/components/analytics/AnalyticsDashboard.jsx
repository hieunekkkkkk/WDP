// src/components/analytics/AnalyticsDashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import StatCard from './StatCard';
import DashboardTabs from './DashboardTabs';
import OverviewTab from './OverviewTab';
import ReportTab from './ReportTab';
import ProgressTab from './ProgressTab';

import './style/AnalyticsDashboard.css';
import {
  FaArrowLeft,
  FaChartLine,
  FaClipboardList,
  FaExclamationTriangle,
  FaTasks,
} from 'react-icons/fa';

const AnalyticsDashboard = () => {
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setAnalyticsData(null);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const month = selectedDate.getMonth() + 1;
        const year = selectedDate.getFullYear();

        const response = await axios.get(
          `${import.meta.env.VITE_BE_URL}/api/calendar/analytics`,
          {
            params: { month, year, userId },

            // headers: { 'x-user-id': userId }
          }
        );

        setAnalyticsData(response?.data?.data || null);
      } catch (error) {
        console.error(
          'Failed to fetch analytics data',
          error?.response || error
        );
        const msg =
          error?.response?.data?.message || 'Không thể tải dữ liệu phân tích.';
        toast.error(msg);
        setAnalyticsData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDate, userId]);

  const kpi = analyticsData?.kpi || {
    incompleteTasks: 0,
    completionRate: 0,
    overdueTasks: 0,
    totalTasks: 0,
  };

  const renderActiveTabContent = () => {
    if (!analyticsData) return null;

    const { overview, summary, report, progress } = analyticsData;

    const reportData = {
      summary: summary,
      ...(report?.charts || {}),
    };

    switch (activeTab) {
      case 'overview':
        return <OverviewTab data={overview} />;
      case 'report':
        return <ReportTab data={reportData} />;
      case 'progress':
        return <ProgressTab data={progress} />;
      default:
        return <ReportTab data={reportData} />;
    }
  };

  return (
    <div className="analytics-container">
      <ToastContainer />
      <header className="analytics-header">
        {/* THÊM NÚT BACK TẠI ĐÂY */}
        <button
          onClick={() => navigate('/dashboard/tasks')}
          className="back-button"
        >
          <FaArrowLeft />
          <span>Back</span>
        </button>
        <h1>Analytics Dashboard</h1>
        <p>Hiểu rõ hơn về hiệu suất công việc của bạn</p>
      </header>

      <section className="monthly-progress-section">
        <div className="section-header">
          <h2>Tiến độ công việc tháng</h2>
          {/* BỌC DATEPICKER TRONG MỘT DIV */}
          <div className="date-picker-wrapper">
            <DatePicker
              selected={selectedDate}
              onChange={(date) => setSelectedDate(date)}
              dateFormat="MMMM yyyy"
              showMonthYearPicker
              className="month-picker"
            />
          </div>
        </div>
        {loading ? (
          <div className="info-message">Đang tải chỉ số...</div>
        ) : (
          <div className="stat-cards-grid">
            <StatCard
              title="Incomplete Tasks"
              value={kpi.incompleteTasks}
              color="red"
              icon={<FaClipboardList />}
            />
            <StatCard
              title="Completion Rate"
              value={`${kpi.completionRate}%`}
              color="green"
              icon={<FaChartLine />}
            />
            <StatCard
              title="Overdue Tasks"
              value={kpi.overdueTasks}
              color="orange"
              icon={<FaExclamationTriangle />}
            />
            <StatCard
              title="Total Tasks"
              value={kpi.totalTasks}
              color="blue"
              icon={<FaTasks />}
            />
          </div>
        )}
      </section>

      <DashboardTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="tab-content">
        {loading ? (
          <div className="loading-message">Đang tải dữ liệu chi tiết...</div>
        ) : analyticsData ? (
          renderActiveTabContent()
        ) : (
          <div className="info-message">Không có dữ liệu để hiển thị.</div>
        )}
      </main>
    </div>
  );
};

export default AnalyticsDashboard;
