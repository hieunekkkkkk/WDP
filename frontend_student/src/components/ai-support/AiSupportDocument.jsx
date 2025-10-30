import React, { useMemo, useState } from "react";
import AiChatModal from "../ai-modal/AiChatModal";
import "./style/AiSupportDocument.css";

const ALL_INDUSTRIES = ["SE", "MKT", "MC", "GD"];
const ITEMS_PER_PAGE = 4; // Số lượng tài liệu hiển thị mỗi trang (4 cards mỗi row)

const MOCK_DOCS = [
  {
    id: 1,
    title: "MLN111",
    desc: "Mô tả chi tiết về tài liệu hỗ trợ",
    author: "Nguyen",
    date: "11/11/2025",
    industry: "SE",
    used: true,
    driveUrl: "https://drive.google.com/drive/folders/YOUR_FOLDER_ID_1",
  },
  {
    id: 2,
    title: "MLN111",
    desc: "Mô tả chi tiết về tài liệu hỗ trợ",
    author: "Nguyen",
    date: "11/11/2025",
    industry: "SE",
    used: true,
    driveUrl: "https://drive.google.com/drive/folders/YOUR_FOLDER_ID_2",
  },
  {
    id: 3,
    title: "MLN111",
    desc: "Mô tả chi tiết về tài liệu hỗ trợ",
    author: "Nguyen",
    date: "11/11/2025",
    industry: "MKT",
    used: true,
    driveUrl: "https://drive.google.com/drive/folders/YOUR_FOLDER_ID_3",
  },
  {
    id: 4,
    title: "MLN111",
    desc: "Mô tả chi tiết về tài liệu hỗ trợ",
    author: "Nguyen",
    date: "11/11/2025",
    industry: "MC",
    used: true,
    driveUrl: "https://drive.google.com/drive/folders/YOUR_FOLDER_ID_4",
  },
  // Thêm nhiều docs để có pagination (cần ít nhất 8 docs để có 2 trang với ITEMS_PER_PAGE=4)
  {
    id: 9,
    title: "MLN112",
    desc: "Tài liệu bổ sung cho môn học",
    author: "Tran",
    date: "12/11/2025",
    industry: "SE",
    used: true,
    driveUrl: "https://drive.google.com/drive/folders/YOUR_FOLDER_ID_9",
  },
  {
    id: 10,
    title: "MLN113",
    desc: "Bài tập và lời giải chi tiết",
    author: "Le",
    date: "13/11/2025",
    industry: "SE",
    used: true,
    driveUrl: "https://drive.google.com/drive/folders/YOUR_FOLDER_ID_10",
  },
  {
    id: 13,
    title: "MLN116",
    desc: "Đề cương ôn tập chi tiết",
    author: "Pham",
    date: "16/11/2025",
    industry: "MKT",
    used: true,
    driveUrl: "https://drive.google.com/drive/folders/YOUR_FOLDER_ID_13",
  },
  {
    id: 14,
    title: "MLN117",
    desc: "Case study thực tế",
    author: "Hoang",
    date: "17/11/2025",
    industry: "MC",
    used: true,
    driveUrl: "https://drive.google.com/drive/folders/YOUR_FOLDER_ID_14",
  },
  {
    id: 15,
    title: "MLN118",
    desc: "Tài liệu tham khảo nâng cao",
    author: "Vu",
    date: "18/11/2025",
    industry: "SE",
    used: true,
    driveUrl: "https://drive.google.com/drive/folders/YOUR_FOLDER_ID_15",
  },
  {
    id: 5,
    title: "MLN111",
    desc: "Mô tả chi tiết về tài liệu hỗ trợ",
    author: "Nguyen",
    date: "11/11/2025",
    industry: "GD",
    used: false,
    driveUrl: "https://drive.google.com/drive/folders/YOUR_FOLDER_ID_5",
  },
  {
    id: 6,
    title: "MLN111",
    desc: "Mô tả chi tiết về tài liệu hỗ trợ",
    author: "Nguyen",
    date: "11/11/2025",
    industry: "SE",
    used: false,
    driveUrl: "https://drive.google.com/drive/folders/YOUR_FOLDER_ID_6",
  },
  {
    id: 7,
    title: "MLN111",
    desc: "Mô tả chi tiết về tài liệu hỗ trợ",
    author: "Nguyen",
    date: "11/11/2025",
    industry: "MKT",
    used: false,
    driveUrl: "https://drive.google.com/drive/folders/YOUR_FOLDER_ID_7",
  },
  {
    id: 8,
    title: "MLN111",
    desc: "Mô tả chi tiết về tài liệu hỗ trợ",
    author: "Nguyen",
    date: "11/11/2025",
    industry: "SE",
    used: false,
    driveUrl: "https://drive.google.com/drive/folders/YOUR_FOLDER_ID_8",
  },
  // Thêm docs mới nhất (cần ít nhất 8 docs)
  {
    id: 11,
    title: "MLN114",
    desc: "Đề thi mẫu và hướng dẫn",
    author: "Pham",
    date: "14/11/2025",
    industry: "MKT",
    used: false,
    driveUrl: "https://drive.google.com/drive/folders/YOUR_FOLDER_ID_11",
  },
  {
    id: 12,
    title: "MLN115",
    desc: "Video bài giảng chi tiết",
    author: "Hoang",
    date: "15/11/2025",
    industry: "GD",
    used: false,
    driveUrl: "https://drive.google.com/drive/folders/YOUR_FOLDER_ID_12",
  },
  {
    id: 16,
    title: "MLN119",
    desc: "Slides bài giảng mới nhất",
    author: "Dao",
    date: "19/11/2025",
    industry: "SE",
    used: false,
    driveUrl: "https://drive.google.com/drive/folders/YOUR_FOLDER_ID_16",
  },
  {
    id: 17,
    title: "MLN120",
    desc: "Bài tập thực hành tuần này",
    author: "Bui",
    date: "20/11/2025",
    industry: "MC",
    used: false,
    driveUrl: "https://drive.google.com/drive/folders/YOUR_FOLDER_ID_17",
  },
  {
    id: 18,
    title: "MLN121",
    desc: "Tài liệu workshop mới",
    author: "Ngo",
    date: "21/11/2025",
    industry: "MKT",
    used: false,
    driveUrl: "https://drive.google.com/drive/folders/YOUR_FOLDER_ID_18",
  },
  {
    id: 19,
    title: "MLN122",
    desc: "Project sample code",
    author: "Dang",
    date: "22/11/2025",
    industry: "SE",
    used: false,
    driveUrl: "https://drive.google.com/drive/folders/YOUR_FOLDER_ID_19",
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
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    className={isOpen ? "rot" : ""}
  >
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
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const FolderIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
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

// DocCard Component - Updated with Drive link
const DocCard = React.memo(({ doc, onChat, onOpenDrive }) => (
  <div className={`ai-card ${doc.used ? "ai-card-popular" : ""}`}>
    <div
      className="ai-card-head"
      onClick={() => onOpenDrive(doc.driveUrl)}
      style={{ cursor: "pointer" }}
      title="Click để mở thư mục tài liệu trên Google Drive"
    >
      <div className="ai-card-badge">{doc.industry}</div>
      <h4 className="ai-card-title">{doc.title}</h4>
      <div className="ai-card-desc">{doc.desc}</div>
    </div>

    <div className="ai-card-footer">
      <div className="ai-meta">
        <div className="ai-meta-item">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>{doc.author}</span>
        </div>
        <div className="ai-meta-item">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span>{doc.date}</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          className="ai-chat-btn"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDrive(doc.driveUrl);
          }}
          title="Mở thư mục Google Drive"
          style={{
            backgroundColor: "#4285f4",
            minWidth: "auto",
            padding: "8px 12px",
          }}
        >
          <FolderIcon />
          <span>Drive</span>
        </button>
        <button
          className="ai-chat-btn"
          onClick={(e) => {
            e.stopPropagation();
            onChat(doc);
          }}
          title="Bắt đầu trò chuyện với AI về tài liệu này"
        >
          <ChatIcon />
          <span>Chat AI</span>
        </button>
      </div>
    </div>
  </div>
));

DocCard.displayName = "DocCard";

// EmptyHint Component
const EmptyHint = ({ text }) => (
  <div className="ai-empty">
    <svg
      width="64"
      height="64"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
    <p>{text}</p>
    <span>Thử tìm kiếm với từ khóa khác hoặc điều chỉnh bộ lọc</span>
  </div>
);

// FilterDropdown Component
const FilterDropdown = ({
  isOpen,
  selectedIndustries,
  onToggle,
  onToggleIndustry,
}) => (
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

// Pagination Component
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  // Luôn hiện pagination nếu có ít nhất 1 trang
  if (totalPages === 0) return null;

  return (
    <div className="ai-pagination">
      <button
        className="ai-pagination-btn"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Trang trước"
      >
        <ArrowIcon direction="left" />
        <span>Trước</span>
      </button>

      <span className="ai-pagination-info">
        Trang {currentPage} / {totalPages}
      </span>

      <button
        className="ai-pagination-btn"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Trang sau"
      >
        <span>Sau</span>
        <ArrowIcon direction="right" />
      </button>
    </div>
  );
};

// Main Component
export default function AiSupportDocument() {
  const [search, setSearch] = useState("");
  const [openFilter, setOpenFilter] = useState(false);
  const [selectedIndustries, setSelectedIndustries] = useState(["SE"]);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [currentPageMostUsed, setCurrentPageMostUsed] = useState(1);
  const [currentPageLatest, setCurrentPageLatest] = useState(1);

  const toggleIndustry = (code) => {
    setSelectedIndustries((prev) =>
      prev.includes(code) ? prev.filter((x) => x !== code) : [...prev, code]
    );
    // Reset về trang 1 khi thay đổi filter
    setCurrentPageMostUsed(1);
    setCurrentPageLatest(1);
  };

  const openChat = (doc) => {
    setSelectedDoc(doc);
    setChatOpen(true);
  };

  // Hàm mở Google Drive
  const openDrive = (driveUrl) => {
    window.open(driveUrl, "_blank", "noopener,noreferrer");
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

  const allMostUsed = useMemo(() => filtered.filter((d) => d.used), [filtered]);
  const allLatest = useMemo(() => filtered.filter((d) => !d.used), [filtered]);

  // Pagination logic
  const totalPagesMostUsed = Math.max(
    1,
    Math.ceil(allMostUsed.length / ITEMS_PER_PAGE)
  );
  const totalPagesLatest = Math.max(
    1,
    Math.ceil(allLatest.length / ITEMS_PER_PAGE)
  );

  const mostUsed = useMemo(() => {
    const start = (currentPageMostUsed - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return allMostUsed.slice(start, end);
  }, [allMostUsed, currentPageMostUsed]);

  const latest = useMemo(() => {
    const start = (currentPageLatest - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return allLatest.slice(start, end);
  }, [allLatest, currentPageLatest]);

  // Reset về trang 1 khi search thay đổi
  React.useEffect(() => {
    setCurrentPageMostUsed(1);
    setCurrentPageLatest(1);
  }, [search]);

  return (
    <>
      <div className="ai-wrap">
        {/* Header Section */}
        <div className="ai-header">
          <h1 className="ai-main-title">Tài Liệu Học Tập Thông Minh</h1>
          <p className="ai-subtitle">
            Trò chuyện với AI để tìm hiểu sâu hơn về các tài liệu học tập
          </p>
          <p
            className="ai-subtitle"
            style={{ fontSize: "0.9em", opacity: 0.8 }}
          >
            💡 Click vào card để mở thư mục Google Drive với tài liệu cộng đồng
            đóng góp
          </p>
        </div>

        {/* Search + Filter */}
        <div className="ai-toolbar">
          <div className="ai-search">
            <span className="ai-search-icon" aria-hidden="true">
              <SearchIcon />
            </span>
            <input
              aria-label="Tìm kiếm tài liệu"
              placeholder="Tìm kiếm theo tên tài liệu, mô tả hoặc tác giả..."
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
        <div className="ai-section">
          <h3 className="ai-section-title">
            Được sử dụng nhiều nhất
            {allMostUsed.length > 0 && (
              <span
                style={{ fontSize: "0.8em", opacity: 0.7, marginLeft: "8px" }}
              >
                ({allMostUsed.length} tài liệu)
              </span>
            )}
          </h3>
          <div className="ai-grid">
            {mostUsed.map((d) => (
              <DocCard
                key={d.id}
                doc={d}
                onChat={openChat}
                onOpenDrive={openDrive}
              />
            ))}
            {mostUsed.length === 0 && allMostUsed.length === 0 && (
              <EmptyHint text="Không có tài liệu phù hợp với bộ lọc." />
            )}
          </div>
          {allMostUsed.length > 0 && (
            <Pagination
              currentPage={currentPageMostUsed}
              totalPages={totalPagesMostUsed}
              onPageChange={setCurrentPageMostUsed}
            />
          )}
        </div>

        {/* Section 2: Latest */}
        <div className="ai-section">
          <h3 className="ai-section-title">
            Mới nhất
            {allLatest.length > 0 && (
              <span
                style={{ fontSize: "0.8em", opacity: 0.7, marginLeft: "8px" }}
              >
                ({allLatest.length} tài liệu)
              </span>
            )}
          </h3>
          <div className="ai-grid">
            {latest.map((d) => (
              <DocCard
                key={d.id}
                doc={d}
                onChat={openChat}
                onOpenDrive={openDrive}
              />
            ))}
            {latest.length === 0 && allLatest.length === 0 && (
              <EmptyHint text="Chưa có tài liệu mới." />
            )}
          </div>
          {allLatest.length > 0 && (
            <Pagination
              currentPage={currentPageLatest}
              totalPages={totalPagesLatest}
              onPageChange={setCurrentPageLatest}
            />
          )}
        </div>
      </div>

      <AiChatModal
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        docTitle={selectedDoc?.title || "Tài liệu"}
      />
    </>
  );
}
