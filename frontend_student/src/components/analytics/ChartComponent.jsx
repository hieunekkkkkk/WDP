import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Bar,
  Line,
  Area,
} from "recharts";

const ChartComponent = ({
  data,
  dataKeyX,
  lines = [],
  bars = [],
  areas = [],
  yAxes = {},
}) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />

        <XAxis dataKey={dataKeyX} tickLine={false} axisLine={false} />

        {/* Trục Y bên trái (mặc định) */}
        <YAxis
          yAxisId="left"
          orientation="left"
          tickLine={false}
          axisLine={false}
          {...(yAxes.left || {})}
        />

        {/* Trục Y bên phải (tùy chọn) */}
        {yAxes.right && (
          <YAxis
            yAxisId="right"
            orientation="right"
            tickLine={false}
            axisLine={false}
            {...yAxes.right}
          />
        )}

        <Tooltip
          contentStyle={{
            borderRadius: "8px",
            border: "none",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        />
        <Legend />

        {/* Render các thành phần biểu đồ */}
        {areas.map((area) => (
          <Area
            key={area.key}
            type="monotone"
            dataKey={area.key}
            fill={area.fill}
            stroke={area.stroke || "none"}
            yAxisId={area.yAxisId || "left"}
          />
        ))}

        {lines.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            stroke={line.stroke}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
            yAxisId={line.yAxisId || "left"}
          />
        ))}

        {bars.map((bar) => (
          <Bar
            key={bar.key}
            dataKey={bar.key}
            fill={bar.color}
            radius={[4, 4, 0, 0]}
            yAxisId={bar.yAxisId || "left"}
            label={bar.label || false}
          />
        ))}
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default ChartComponent;
