// src/components/analytics/ChartComponent.jsx
import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  LineChart,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Bar,
  Line,
  Area,
} from "recharts";

const ChartComponent = ({ type, data, dataKeyX, lines, bars, areas }) => {
  const renderChart = () => {
    switch (type) {
      case "bar":
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={dataKeyX} />
            <YAxis />
            <Tooltip />
            <Legend />
            {bars?.map((bar) => (
              <Bar key={bar.key} dataKey={bar.key} fill={bar.color} />
            ))}
          </BarChart>
        );
      case "area":
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={dataKeyX} />
            <YAxis />
            <Tooltip />
            <Legend />
            {areas?.map((area) => (
              <Area
                key={area.key}
                type="monotone"
                dataKey={area.key}
                stroke={area.stroke}
                fill={area.fill}
              />
            ))}
          </AreaChart>
        );
      // Thêm các loại chart khác nếu cần
      default:
        return <div>Invalid chart type</div>;
    }
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      {renderChart()}
    </ResponsiveContainer>
  );
};

export default ChartComponent;
