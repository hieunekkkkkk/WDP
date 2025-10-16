import React from "react";

const StatCard = ({ title, value, color }) => {
  return (
    <div className="stat-card">
      <span className="stat-card-title">{title}</span>
      <span className={`stat-card-value color-${color}`}>{value}</span>
    </div>
  );
};

export default StatCard;
