// src/components/analytics/ReportTab.jsx
import React from "react";
import ChartComponent from "./ChartComponent";

const ReportTab = ({ data }) => {
  if (!data)
    return <div className="info-message">Không có dữ liệu báo cáo.</div>;
  const { summary, taskProgressTrends, weeklyWorkload, last7DaysPerformance } =
    data;

  return (
    <div className="report-grid">
      <div className="report-summary">
        <div className="summary-card">
          <h4>Today's Overview</h4>
          <p className="value">
            {summary?.today?.total || 0} Total /{" "}
            {summary?.today?.completed || 0} Done
          </p>
          <small>{summary?.today?.successRate || 0}% Success Rate</small>
        </div>
        <div className="summary-card">
          <h4>Weekly Overview</h4>
          <p className="value">
            {summary?.thisWeek?.total || 0} Total /{" "}
            {summary?.thisWeek?.completed || 0} Done
          </p>
          <small>{summary?.thisWeek?.successRate || 0}% Success Rate</small>
        </div>
        <div className="summary-card">
          <h4>Monthly Overview</h4>
          <p className="value">
            {summary?.thisMonth?.total || 0} Total /{" "}
            {summary?.thisMonth?.completed || 0} Done
          </p>
          <small>{summary?.thisMonth?.successRate || 0}% Success Rate</small>
        </div>
      </div>

      <div className="chart-container">
        <h4>Task Progress Trends</h4>
        <ChartComponent
          type="area"
          data={taskProgressTrends}
          dataKeyX="date"
          areas={[
            { key: "total", stroke: "#8884d8", fill: "#8884d8" },
            { key: "completed", stroke: "#82ca9d", fill: "#82ca9d" },
          ]}
        />
      </div>

      <div className="chart-container">
        <h4>Weekly Workload Distribution</h4>
        <ChartComponent
          type="bar"
          data={weeklyWorkload}
          dataKeyX="day"
          bars={[{ key: "count", color: "#8884d8" }]}
        />
      </div>

      <div className="chart-container performance-container">
        <h4>Last 7 Days Performance</h4>
        <div className="performance-bars">
          {last7DaysPerformance?.map((item) => (
            <div key={item.day} className="performance-bar-item">
              <span
                className="bar-percentage"
                style={{ color: item.percentage > 80 ? "#4caf50" : "#ff9f43" }}
              >
                {item.percentage}%
              </span>
              <div
                className="bar"
                style={{ height: `${item.percentage}%` }}
              ></div>
              <span className="bar-label">{item.day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportTab;
