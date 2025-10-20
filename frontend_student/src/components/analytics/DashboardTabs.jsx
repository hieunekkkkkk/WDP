import React from "react";
import {
  FaChartPie,
  FaLightbulb,
  FaClipboardList,
  FaTasks,
} from "react-icons/fa";

const DashboardTabs = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: "overview", label: "Overview", icon: <FaChartPie /> },
    { id: "report", label: "Report", icon: <FaClipboardList /> },
    { id: "progress", label: "Progress", icon: <FaTasks /> },
  ];

  return (
    <nav className="dashboard-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </nav>
  );
};

export default DashboardTabs;
