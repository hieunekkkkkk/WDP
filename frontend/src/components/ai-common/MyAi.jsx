import React from "react";
import "./style/MyAi.css";

export default function MyAi() {
  const suggestions = [
    "How about an inspirational quote graphic for social me...",
    "I need a poster for our online store’s seasonal sale",
    "Highlight my favorite hiking trail in a Facebook post",
    "Create an infographic showcasing the benefits of meditation...",
  ];

  const chats = {
    Today: ["Brooklyn Sunrise Time", "Manhattan Bus Comparisons"],
    Yesterday: [
      "Tax Assistance Request",
      "Quadratic Function Plot",
      "Toyota Names Poetry",
      "Urban Green Spaces",
    ],
    "Previous 7 Days": [
      "Historical Landmarks Guide",
      "Gourmet Food Truck Trends",
      "Digital Art Techniques",
    ],
  };

  return (
    <div className="ai-layout">
      {/* Main panel */}
      <div className="ai-main">
        <div className="ai-avatar">
          <img
            src="https://icdn.dantri.com.vn/a3HWDOlTcvMNT73KRccc/Image/2013/05/3-904f5.jpg"
            alt="AI avatar"
            style={{
              background: "linear-gradient(45deg, #FF6B6B, #FFD93D)",
              borderRadius: "50%",
            }}
          />
        </div>
        <h2 className="ai-title">Arkad</h2>
        <p className="ai-subtitle">
          BachDND <span style={{ fontSize: "12px" }}>ⓘ</span>
        </p>
        <p className="ai-desc">
          Effortlessly design anything: presentations, logos, social media posts
          and more.
        </p>

        <div className="ai-suggestions">
          {suggestions.map((s, i) => (
            <button key={i} className="ai-suggestion">
              {s}
            </button>
          ))}
        </div>

        <div className="ai-input-bar">
          <span className="ai-plus">＋</span>
          <input placeholder="Ask anything" />
          <button className="ai-mic">🎤</button>
        </div>
      </div>

      {/* Sidebar - giữ nguyên từ phiên bản trước */}
      <div className="ai-sidebar">
        <div className="ai-search">
          <input placeholder="Search chats..." />
          <button className="ai-close">✕</button>
        </div>
        <div className="ai-newchat">New chat</div>

        <div className="ai-chatlist">
          {Object.entries(chats).map(([section, items]) => (
            <div key={section} className="ai-chat-section">
              <div className="ai-chat-section-title">{section}</div>
              {items.map((chat, i) => (
                <div
                  key={i}
                  className={`ai-chat-item ${
                    chat === "Manhattan Bus Comparisons" ? "active" : ""
                  }`}
                >
                  {chat}
                  {chat === "Manhattan Bus Comparisons" && (
                    <span className="ai-chat-arrow">↗</span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
