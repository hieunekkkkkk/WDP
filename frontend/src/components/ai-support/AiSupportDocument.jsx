import React, { useMemo, useState } from "react";
import "./style/AiSupportDocument.css";

const ALL_INDUSTRIES = ["SE", "MKT", "MC", "GD"];

const MOCK_DOCS = [
  {
    id: 1,
    title: "MLN111",
    desc: "Mô tả chi tiết",
    author: "Nguyen",
    date: "11/11/2025",
    industry: "SE",
    used: true,
  },
  {
    id: 2,
    title: "MLN111",
    desc: "Mô tả chi tiết",
    author: "Nguyen",
    date: "11/11/2025",
    industry: "SE",
    used: true,
  },
  {
    id: 3,
    title: "MLN111",
    desc: "Mô tả chi tiết",
    author: "Nguyen",
    date: "11/11/2025",
    industry: "MKT",
    used: true,
  },
  {
    id: 4,
    title: "MLN111",
    desc: "Mô tả chi tiết",
    author: "Nguyen",
    date: "11/11/2025",
    industry: "MC",
    used: true,
  },
  {
    id: 5,
    title: "MLN111",
    desc: "Mô tả chi tiết",
    author: "Nguyen",
    date: "11/11/2025",
    industry: "GD",
    used: false,
  },
  {
    id: 6,
    title: "MLN111",
    desc: "Mô tả chi tiết",
    author: "Nguyen",
    date: "11/11/2025",
    industry: "SE",
    used: false,
  },
  {
    id: 7,
    title: "MLN111",
    desc: "Mô tả chi tiết",
    author: "Nguyen",
    date: "11/11/2025",
    industry: "MKT",
    used: false,
  },
  {
    id: 8,
    title: "MLN111",
    desc: "Mô tả chi tiết",
    author: "Nguyen",
    date: "11/11/2025",
    industry: "SE",
    used: false,
  },
];

export default function AiSupportDocument() {
  const [search, setSearch] = useState("");
  const [openFilter, setOpenFilter] = useState(false);
  const [selectedIndustries, setSelectedIndustries] = useState(["SE"]); // theo Figma đang tick SE

  const toggleIndustry = (code) => {
    setSelectedIndustries((prev) =>
      prev.includes(code) ? prev.filter((x) => x !== code) : [...prev, code]
    );
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return MOCK_DOCS.filter((d) => {
      const matchText =
        !q ||
        d.title.toLowerCase().includes(q) ||
        d.desc.toLowerCase().includes(q) ||
        d.author.toLowerCase().includes(q);
      const matchIndustry =
        selectedIndustries.length === 0 ||
        selectedIndustries.includes(d.industry);
      return matchText && matchIndustry;
    });
  }, [search, selectedIndustries]);

  const mostUsed = filtered.filter((d) => d.used);
  const latest = filtered.filter((d) => !d.used);

  return (
    <div className="ai-wrap" style={{ position: "relative" }}>
      {/* Search + Filter */}
      <div className="ai-toolbar">
        <div className="ai-search">
          <span className="ai-search-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                d="M21 21l-3.8-3.8m1.8-5.2a7 7 0 11-14 0 7 7 0 0114 0z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <input
            aria-label="Tìm kiếm AI"
            placeholder="Tìm kiếm AI"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="ai-filter">
          <button
            className="ai-filter-btn"
            onClick={() => setOpenFilter((s) => !s)}
            aria-haspopup="menu"
            aria-expanded={openFilter}
          >
            <span>Chọn ngành</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              className={openFilter ? "rot" : ""}
            >
              <path
                d="M6 9l6 6 6-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>

          {openFilter && (
            <div className="ai-filter-menu" role="menu">
              <div className="ai-filter-title">Status</div>
              {ALL_INDUSTRIES.map((ind) => (
                <label key={ind} className="ai-filter-item">
                  <input
                    type="checkbox"
                    checked={selectedIndustries.includes(ind)}
                    onChange={() => toggleIndustry(ind)}
                  />
                  <span>{ind}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section 1 */}
      <h3 className="ai-section-title">Dựng cơ sở dữ liệu nhiều nhất</h3>
      <div className="ai-grid">
        {mostUsed.map((d) => (
          <DocCard key={d.id} doc={d} />
        ))}
        {mostUsed.length === 0 && (
          <EmptyHint text="Không có tài liệu phù hợp bộ lọc." />
        )}
      </div>

      {/* Section 2 */}
      <h3 className="ai-section-title">Mới nhất</h3>
      <div className="ai-grid">
        {latest.map((d) => (
          <DocCard key={d.id} doc={d} />
        ))}
        {latest.length === 0 && <EmptyHint text="Chưa có tài liệu mới." />}
      </div>

      {/* Navigation buttons */}
      <div className="ai-nav-btn left" onClick={() => alert("Prev")}>
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path
            d="M15 6l-6 6 6 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="ai-nav-btn right" onClick={() => alert("Next")}>
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path
            d="M9 18l6-6-6-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}

function DocCard({ doc }) {
  return (
    <div className="ai-card">
      <div className="ai-card-head">
        <h4 className="ai-card-title">{doc.title}</h4>
        <div className="ai-card-desc">{doc.desc}</div>
      </div>

      <div className="ai-card-footer">
        <div className="ai-meta">
          <div>
            Author: <span>{doc.author}</span>
          </div>
          <div>
            Date: <span>{doc.date}</span>
          </div>
        </div>
        <a className="ai-link" href="#" onClick={(e) => e.preventDefault()}>
          Xem thêm
        </a>
      </div>
    </div>
  );
}

function EmptyHint({ text }) {
  return <div className="ai-empty">{text}</div>;
}
