import React, { useMemo, useState } from "react";
import AiChatModal from "../ai-modal/AiChatModal";
import "./style/AiSupportDocument.css";

const ALL_INDUSTRIES = ["SE", "MKT", "MC", "GD"];

const MOCK_DOCS = [
  {
    id: 1,
    title: "MLN111",
    desc: "Mô tả chi tiết về tài liệu hỗ trợ",
    author: "Nguyen",
    date: "11/11/2025",
    industry: "SE",
    used: true,
  },
  {
    id: 2,
    title: "MLN111",
    desc: "Mô tả chi tiết về tài liệu hỗ trợ",
    author: "Nguyen",
    date: "11/11/2025",
    industry: "SE",
    used: true,
  },
  {
    id: 3,
    title: "MLN111",
    desc: "Mô tả chi tiết về tài liệu hỗ trợ",
    author: "Nguyen",
    date: "11/11/2025",
    industry: "MKT",
    used: true,
  },
  {
    id: 4,
    title: "MLN111",
    desc: "Mô tả chi tiết về tài liệu hỗ trợ",
    author: "Nguyen",
    date: "11/11/2025",
    industry: "MC",
    used: true,
  },
  {
    id: 5,
    title: "MLN111",
    desc: "Mô tả chi tiết về tài liệu hỗ trợ",
    author: "Nguyen",
    date: "11/11/2025",
    industry: "GD",
    used: false,
  },
  {
    id: 6,
    title: "MLN111",
    desc: "Mô tả chi tiết về tài liệu hỗ trợ",
    author: "Nguyen",
    date: "11/11/2025",
    industry: "SE",
    used: false,
  },
  {
    id: 7,
    title: "MLN111",
    desc: "Mô tả chi tiết về tài liệu hỗ trợ",
    author: "Nguyen",
    date: "11/11/2025",
    industry: "MKT",
    used: false,
  },
  {
    id: 8,
    title: "MLN111",
    desc: "Mô tả chi tiết về tài liệu hỗ trợ",
    author: "Nguyen",
    date: "11/11/2025",
    industry: "SE",
    used: false,
  },
];

// Icon Components
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path
      d="M21 21l-3.8-3.8m1.8-5.2a7 7 0 11-14 0 7 7 0 0114 0z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const ChevronIcon = ({ isOpen }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" className={isOpen ? "rot" : ""}>
    <path
      d="M6 9l6 6 6-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const ChatIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const ArrowIcon = ({ direction }) => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path
      d={direction === "left" ? "M15 6l-6 6 6 6" : "M9 18l6-6-6-6"}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

// DocCard Component
const DocCard = React.memo(({ doc, onChat }) => (
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
      <button className="ai-chat-btn" onClick={() => onChat(doc)}>
        <ChatIcon />
        Chat ngay
      </button>
    </div>
  </div>
));

DocCard.displayName = "DocCard";

// EmptyHint Component
const EmptyHint = ({ text }) => <div className="ai-empty">{text}</div>;

// FilterDropdown Component
const FilterDropdown = ({ isOpen, selectedIndustries, onToggle, onToggleIndustry }) => (
  <div className="ai-filter">
    <button
      className="ai-filter-btn"
      onClick={onToggle}
      aria-haspopup="menu"
      aria-expanded={isOpen}
    >
      <span>Chọn ngành</span>
      <ChevronIcon isOpen={isOpen} />
    </button>

    {isOpen && (
      <div className="ai-filter-menu" role="menu">
        <div className="ai-filter-title">Ngành</div>
        {ALL_INDUSTRIES.map((ind) => (
          <label key={ind} className="ai-filter-item">
            <input
              type="checkbox"
              checked={selectedIndustries.includes(ind)}
              onChange={() => onToggleIndustry(ind)}
            />
            <span>{ind}</span>
          </label>
        ))}
      </div>
    )}
  </div>
);

// Main Component
export default function AiSupportDocument() {
  const [search, setSearch] = useState("");
  const [openFilter, setOpenFilter] = useState(false);
  const [selectedIndustries, setSelectedIndustries] = useState(["SE"]);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const toggleIndustry = (code) => {
    setSelectedIndustries((prev) =>
      prev.includes(code) ? prev.filter((x) => x !== code) : [...prev, code]
    );
  };

  const openChat = (doc) => {
    setSelectedDoc(doc);
    setChatOpen(true);
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
        selectedIndustries.length === 0 || selectedIndustries.includes(d.industry);
      return matchText && matchIndustry;
    });
  }, [search, selectedIndustries]);

  const mostUsed = useMemo(() => filtered.filter((d) => d.used), [filtered]);
  const latest = useMemo(() => filtered.filter((d) => !d.used), [filtered]);

  return (
    <>
      <div className="ai-wrap">
        {/* Search + Filter */}
        <div className="ai-toolbar">
          <div className="ai-search">
            <span className="ai-search-icon" aria-hidden="true">
              <SearchIcon />
            </span>
            <input
              aria-label="Tìm kiếm AI"
              placeholder="Tìm kiếm tài liệu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <FilterDropdown
            isOpen={openFilter}
            selectedIndustries={selectedIndustries}
            onToggle={() => setOpenFilter((s) => !s)}
            onToggleIndustry={toggleIndustry}
          />
        </div>

        {/* Section 1: Most Used */}
        <h3 className="ai-section-title">Được sử dụng nhiều nhất</h3>
        <div className="ai-grid">
          {mostUsed.map((d) => (
            <DocCard key={d.id} doc={d} onChat={openChat} />
          ))}
          {mostUsed.length === 0 && (
            <EmptyHint text="Không có tài liệu phù hợp với bộ lọc." />
          )}
        </div>

        {/* Section 2: Latest */}
        <h3 className="ai-section-title">Mới nhất</h3>
        <div className="ai-grid">
          {latest.map((d) => (
            <DocCard key={d.id} doc={d} onChat={openChat} />
          ))}
          {latest.length === 0 && <EmptyHint text="Chưa có tài liệu mới." />}
        </div>

        {/* Navigation buttons */}
        <button className="ai-nav-btn left" onClick={() => alert("Prev")} aria-label="Previous">
          <ArrowIcon direction="left" />
        </button>

        <button className="ai-nav-btn right" onClick={() => alert("Next")} aria-label="Next">
          <ArrowIcon direction="right" />
        </button>
      </div>

      <AiChatModal
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        docTitle={selectedDoc?.title || "Tài liệu"}
      />
    </>
  );
}