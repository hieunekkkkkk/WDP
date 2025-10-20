import React from "react";

const StatCard = ({ title, value, icon, color }) => {
  const cardColorClass = `stat-card-${color}`;

  return (
    <div className={`stat-card ${cardColorClass}`}>
      <div className="stat-card-icon">{icon}</div>
      <div className="stat-card-info">
        <span className="stat-card-title">{title}</span>
        <span className="stat-card-value">{value}</span>
      </div>
    </div>
  );
};

export default StatCard;
