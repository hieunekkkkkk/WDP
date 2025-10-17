
import React from "react";
import ChartComponent from "./ChartComponent";

// Component con để hiển thị % trên cột của biểu đồ Performance
const CustomBarLabel = (props) => {
  const { x, y, width, value } = props;
  const color = value < 50 ? "#ef4444" : "#22c55e"; 
  return (
    <text
      x={x + width / 2}
      y={y}
      fill={color}
      dy={-6}
      textAnchor="middle"
      fontSize={12}
      fontWeight="bold"
    >
      {`${value}%`}
    </text>
  );
};

const ReportTab = ({ data }) => {
  const safeData = data || {};
  const {
    summary,
    taskProgressTrends = [],
    weeklyWorkloadDistribution: weeklyWorkload = {},
    last7DaysPerformance = [],
  } = safeData;

  // Chuẩn bị dữ liệu cho biểu đồ Weekly Workload
  const weeklyWorkloadChartData = Object.entries(weeklyWorkload).map(
    ([day, values]) => ({
      day,
      Completed: values.completed,
      Incomplete: values.incomplete,
    })
  );

  return (
    <div className="report-grid">
      {/* Phần Summary giữ nguyên */}
      <div className="report-summary">{/* ... */}</div>

      {/* BIỂU ĐỒ 1: Task Progress Trends (kết hợp Area và Line) */}
      <div className="chart-container">
        <h4>Task Progress Trends</h4>
        <ChartComponent
          data={taskProgressTrends}
          dataKeyX="date"
          yAxes={{
            left: { tickCount: 5 }, 
            right: { domain: [0, 100], tickFormatter: (v) => `${v}%` }, 
          }}
          areas={[
            {
              key: "Completed",
              fill: "#82ca9d",
              stroke: "#82ca9d",
              yAxisId: "left",
            },
          ]}
          lines={[{ key: "Progress", stroke: "#ff7300", yAxisId: "right" }]}
        />
      </div>

      {/* BIỂU ĐỒ 2: Weekly Workload Distribution (biểu đồ Area chồng) */}
      <div className="chart-container">
        <h4>Weekly Workload Distribution</h4>
        <ChartComponent
          data={weeklyWorkloadChartData}
          dataKeyX="day"
          areas={[
            { key: "Completed", fill: "#82ca9d", stroke: "none" },
            { key: "Incomplete", fill: "#8884d8", stroke: "none" },
          ]}
        />
      </div>

      {/* BIỂU ĐỒ 3: Last 7 Days Performance (Bar với label tùy chỉnh) */}
      <div className="chart-container performance-container">
        <h4>Last 7 Days Performance</h4>
        <ChartComponent
          data={last7DaysPerformance}
          dataKeyX="day"
          yAxes={{ left: { domain: [0, 100], hide: true } }} 
          bars={[
            {
              key: "percentage",
              color: "#22c55e", 
              label: <CustomBarLabel />,
            },
          ]}
        />
      </div>
    </div>
  );
};

export default ReportTab;
