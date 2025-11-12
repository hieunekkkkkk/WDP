import React, { useMemo, useState, useEffect } from "react";
import AiChatModal from "../ai-modal/AiChatModal";
import SubjectAPI, { DataTransformer } from "../../api/SubjectAPI";
import "./style/AiSupportDocument.css";

const ALL_INDUSTRIES = ["SE", "MKT", "MC", "GD"];
const ITEMS_PER_PAGE = 4;

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

const ArrowIcon = ({ direction }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    style={{
      transform: direction === "left" ? "rotate(180deg)" : "none",
    }}
  >
    <path
      d="M9 18l6-6-6-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const DriveIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

// DocCard Component - semantic markup + schema.org properties for SEO
const DocCard = React.memo(({ doc, onChat }) => (
  <article
    className="ai-doc-card"
    itemScope
    itemType="https://schema.org/CreativeWork"
    aria-labelledby={`doc-title-${doc.id || doc._id}`}
  >
    <div className="ai-doc-meta">
      <span className="ai-doc-tag" itemProp="genre">
        {doc.industry}
      </span>
      <span className="ai-doc-date" itemProp="datePublished">
        {doc.date}
      </span>
    </div>

    {/* Title: use an internal crawlable link to improve indexability */}
    <h4 className="ai-doc-title" id={`doc-title-${doc.id || doc._id}`}>
      <a href={`#`} itemProp="url" className="ai-doc-link" title={doc.title}>
        <span itemProp="name">{doc.title}</span>
      </a>
    </h4>

    <p className="ai-doc-desc" itemProp="description">
      {doc.desc}
    </p>

    <div className="ai-doc-footer">
      <span className="ai-doc-author" itemProp="author">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        {doc.author}
      </span>

      <div className="ai-doc-actions">
        {/* Drive: external link should be crawlable but open in new tab */}
        <a
          className="ai-doc-drive-btn"
          href={doc.driveUrl || "#"}
          onClick={(e) => e.stopPropagation()}
          title="Mở Google Drive"
          target="_blank"
          rel="noopener noreferrer"
          itemProp="sameAs"
        >
          <DriveIcon />
          <span>Drive</span>
        </a>

        <button
          className="ai-doc-chat-btn"
          onClick={(e) => {
            e.stopPropagation();
            onChat(doc);
          }}
          title="Bắt đầu trò chuyện với AI về tài liệu này"
          aria-label={`Chat AI về ${doc.title}`}
        >
          <ChatIcon />
          <span>Chat AI</span>
        </button>
      </div>
    </div>
  </article>
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

// LoadingSpinner Component
const LoadingSpinner = () => (
  <div className="ai-loading">
    <div className="ai-spinner"></div>
    <p>Đang tải tài liệu...</p>
  </div>
);

// ErrorMessage Component
const ErrorMessage = ({ message, onRetry }) => (
  <div className="ai-error">
    <svg
      width="64"
      height="64"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
    <p>{message || "Không thể tải dữ liệu. Vui lòng thử lại."}</p>
    {onRetry && (
      <button className="ai-retry-btn" onClick={onRetry}>
        Thử lại
      </button>
    )}
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

  // API State
  const [allDocuments, setAllDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch documents from API
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      let documents = [];
      if (selectedIndustries.length > 0) {
        // Fetch documents by selected categories
        const promises = selectedIndustries.map((category) =>
          SubjectAPI.getByCategory(category)
        );
        const results = await Promise.all(promises);
        documents = results.flat(); // Combine results from all categories
      } else {
        // Fetch all documents if no category is selected
        const response = await SubjectAPI.getAllSubjects(100);
        documents = response.subjects || [];
      }

      // Transform data from backend to frontend format
      const transformedDocuments = DataTransformer.toFrontendArray(documents);
      setAllDocuments(transformedDocuments);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError("Không thể tải dữ liệu từ server. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch on component mount
  useEffect(() => {
    fetchDocuments();
  }, [selectedIndustries]);

  const toggleIndustry = (code) => {
    setSelectedIndustries((prev) =>
      prev.includes(code) ? prev.filter((x) => x !== code) : [...prev, code]
    );
    // Reset về trang 1 khi thay đổi filter
    setCurrentPageMostUsed(1);
    setCurrentPageLatest(1);
  };

  const openChat = (doc) => {
    setSelectedDoc({
      ...doc,
      industry: doc.industry,
    });
    setChatOpen(true);
  };

  const allMostUsed = useMemo(
    () => allDocuments.filter((d) => d.used),
    [allDocuments]
  );
  const allLatest = useMemo(
    () => allDocuments.filter((d) => !d.used),
    [allDocuments]
  );

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
  useEffect(() => {
    setCurrentPageMostUsed(1);
    setCurrentPageLatest(1);
  }, [search]);

  useEffect(() => {
    if (loading || error) return;

    const count = allDocuments.length || 0;
    const title = `Tài Liệu Học Tập Thông Minh - ${count} tài liệu`;
    try {
      document.title = title;

      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }
      meta.setAttribute(
        "content",
        "Kho tài liệu học tập cộng đồng - tìm kiếm, truy cập thư mục Drive và trò chuyện với AI để hiểu sâu hơn về nội dung."
      );

      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.setAttribute("rel", "canonical");
        document.head.appendChild(canonical);
      }
      canonical.setAttribute("href", window.location.href);

      const scriptId = "ai-docs-jsonld";
      const prev = document.getElementById(scriptId);
      if (prev) prev.remove();

      const itemList = allDocuments.map((d, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${window.location.origin}/documents/${d.id}`,
        item: {
          "@type": "CreativeWork",
          name: d.title,
          description: d.desc,
          author: d.author,
          datePublished: d.date,
          sameAs: d.driveUrl || undefined,
        },
      }));

      const jsonld = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Tài Liệu Học Tập Thông Minh",
        itemListElement: itemList,
      };

      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = scriptId;
      script.text = JSON.stringify(jsonld);
      document.head.appendChild(script);

      return () => {
        const s = document.getElementById(scriptId);
        if (s) s.remove();
      };
    } catch (err) {
      // ignore head-manipulation errors in environments without DOM
      console.warn("[AiSupportDocument] head update failed", err);
    }
  }, [loading, error, allDocuments]);

  // Show loading state
  if (loading) {
    return (
      <div className="ai-wrap">
        <LoadingSpinner />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="ai-wrap">
        <ErrorMessage message={error} onRetry={fetchDocuments} />
      </div>
    );
  }

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
              <DocCard key={d.id} doc={d} onChat={openChat} />
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
              <DocCard key={d.id} doc={d} onChat={openChat} />
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
        docData={selectedDoc}
      />
    </>
  );
}
