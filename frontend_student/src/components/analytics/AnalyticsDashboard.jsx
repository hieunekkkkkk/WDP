// src/components/analytics/AnalyticsDashboard.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import StatCard from "./StatCard";
import DashboardTabs from "./DashboardTabs";
import OverviewTab from "./OverviewTab";
import ReportTab from "./ReportTab";
import ProgressTab from "./ProgressTab";

import "./style/AnalyticsDashboard.css";

const AnalyticsDashboard = () => {
  const { userId } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      // Nếu chưa có userId (Clerk chưa mount hoặc chưa login), clear data
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

        console.log("analytics raw response:", response?.data);
        setAnalyticsData(response?.data?.data || null);

        toast.success("Tải dữ liệu phân tích thành công!");
      } catch (error) {
        console.error(
          "Failed to fetch analytics data",
          error?.response || error
        );
        const msg =
          error?.response?.data?.message || "Không thể tải dữ liệu phân tích.";
        toast.error(msg);
        setAnalyticsData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDate, userId]);

  const renderActiveTabContent = () => {
    if (!analyticsData) {
      return <div className="info-message">Không có dữ liệu để hiển thị.</div>;
    }

    switch (activeTab) {
      case "report":
        return <ReportTab data={analyticsData.report} />;
      case "progress":
        return <ProgressTab data={analyticsData.progress} />;
      case "overview":
      default:
        return <OverviewTab data={analyticsData.overview} />;
    }
  };

  const kpi = analyticsData?.kpi || {};

  return (
    <div className="analytics-container">
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      <header className="analytics-header">
        <h1>Data Analytics Dashboard</h1>
        <p>Track your task performance and productivity insights</p>
      </header>

      <section className="monthly-progress-section">
        <div className="section-header">
          <h2>Tiến độ công việc tháng</h2>
          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            dateFormat="MMMM yyyy"
            showMonthYearPicker
            className="month-picker"
          />
        </div>
        {loading ? (
          <div className="info-message">Đang tải chỉ số...</div>
        ) : (
          <div className="stat-cards-grid">
            <StatCard
              title="Incomplete Tasks"
              value={kpi.incompleteTasks}
              color="red"
            />
            <StatCard
              title="Completion Rate"
              value={`${kpi.completionRate}%`}
              color="green"
            />
            <StatCard
              title="Overdue Tasks"
              value={kpi.overdueTasks}
              color="orange"
            />
            <StatCard title="Total Tasks" value={kpi.totalTasks} color="blue" />
          </div>
        )}
      </section>

      <DashboardTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="tab-content">
        {loading ? (
          <div className="loading-message">Đang tải dữ liệu chi tiết...</div>
        ) : (
          renderActiveTabContent()
        )}
      </main>
    </div>
  );
};

export default AnalyticsDashboard;
