import React, { useState, useEffect, useMemo } from "react";
import AiChatModal from "../ai-modal/AiChatModal";
import SubjectAPI, { DataTransformer } from "../../api/SubjectAPI";
import "./style/AiSupportDocument.css";

// === Icon Components ===
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

// === Components ===
const DocCard = ({ doc, onChat }) => (
  <article className="ai-doc-card">
    <div className="ai-doc-meta">
      <span className="ai-doc-tag">{doc.industry}</span>
      <span className="ai-doc-date">{doc.date}</span>
    </div>
    <h4 className="ai-doc-title">{doc.title}</h4>
    <p className="ai-doc-desc">{doc.desc}</p>
    <div className="ai-doc-footer">
      <span className="ai-doc-author">{doc.author}</span>
      <div className="ai-doc-actions">
        {doc.driveUrl && (
          <a
            className="ai-doc-drive-btn"
            href={doc.driveUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <DriveIcon /> Drive
          </a>
        )}
        <button className="ai-doc-chat-btn" onClick={() => onChat(doc)}>
          <ChatIcon /> Chat AI
        </button>
      </div>
    </div>
  </article>
);

const FilterDropdown = ({
  isOpen,
  selected,
  onToggle,
  onToggleCategory,
  categories,
}) => (
  <div className="ai-filter">
    <button className="ai-filter-btn" onClick={onToggle}>
      <span>Chọn môn học</span>
      <ChevronIcon isOpen={isOpen} />
    </button>
    {isOpen && (
      <div className="ai-filter-menu">
        <div className="ai-filter-title">Môn học</div>
        {categories.length === 0 && <p>Không có danh mục</p>}
        {categories.map((cat) => (
          <label key={cat} className="ai-filter-item">
            <input
              type="checkbox"
              checked={selected.includes(cat)}
              onChange={() => onToggleCategory(cat)}
            />
            <span>{cat}</span>
          </label>
        ))}
      </div>
    )}
  </div>
);

const LoadingSpinner = () => (
  <div className="ai-loading">
    <div className="ai-spinner"></div>
    <p>Đang tải tài liệu...</p>
  </div>
);

const ITEMS_PER_PAGE = 4;

export default function AiSupportDocument() {
  const [search, setSearch] = useState("");
  const [openFilter, setOpenFilter] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const [documents, setDocuments] = useState([]);
  const [latestDocs, setLatestDocs] = useState([]);

  const [pageMost, setPageMost] = useState(1);
  const [pageLatest, setPageLatest] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // === FETCH HAY DÙNG ===
  const fetchSubjects = async (reset = true) => {
    try {
      setLoading(true);
      const res = await SubjectAPI.getAllSubjects(30);
      const subjects = res.subjects || [];
      const active = subjects.filter((s) => s.used === true);
      const uniqueCats = [
        ...new Set(active.map((s) => s.category).filter(Boolean)),
      ];
      setCategories(uniqueCats);

      const filtered =
        selected.length > 0
          ? active.filter((s) => selected.includes(s.category))
          : active;

      const transformed = DataTransformer.toFrontendArray(filtered);
      setDocuments(reset ? transformed : [...documents, ...transformed]);
    } catch (err) {
      console.error("Error fetching subjects:", err);
      setError("Không thể tải dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  // === FETCH MỚI NHẤT ===
  const fetchLatest = async () => {
    try {
      const res = await SubjectAPI.getLatestSubjects(30);
      const active = (Array.isArray(res) ? res : res.subjects || []).filter(
        (s) => s.used === true
      );
      setLatestDocs(DataTransformer.toFrontendArray(active));
    } catch (err) {
      console.error("Error fetching latest:", err);
    }
  };

  useEffect(() => {
    fetchSubjects(true);
    fetchLatest();
  }, [selected]);

  // === SEARCH BACKEND ===
  useEffect(() => {
    const fetchSearch = async () => {
      if (!search.trim()) {
        fetchSubjects(true);
        fetchLatest();
        return;
      }
      try {
        setLoading(true);
        const res = await SubjectAPI.searchByTitle(search);
        const data = Array.isArray(res) ? res : res.subjects || [];
        const active = data.filter((s) => s.used === true);
        const filtered =
          selected.length > 0
            ? active.filter((s) => selected.includes(s.category))
            : active;
        const transformed = DataTransformer.toFrontendArray(filtered);
        setDocuments(transformed);
        setLatestDocs([]); // khi tìm kiếm chỉ hiện 1 danh sách
      } catch (err) {
        console.error("Search failed:", err);
        setError("Không thể tìm kiếm dữ liệu từ server.");
      } finally {
        setLoading(false);
      }
    };

    const delay = setTimeout(fetchSearch, 500);
    return () => clearTimeout(delay);
  }, [search, selected]);

  const toggleCategory = (cat) => {
    setSelected((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const openChat = (doc) => {
    setSelectedDoc(doc);
    setChatOpen(true);
  };

  if (loading) return <LoadingSpinner />;
  if (error)
    return (
      <div className="ai-wrap">
        <p>{error}</p>
      </div>
    );

  // pagination client-side
  const totalMost = Math.ceil(documents.length / ITEMS_PER_PAGE);
  const totalLatest = Math.ceil(latestDocs.length / ITEMS_PER_PAGE);
  const pagedMost = documents.slice(
    (pageMost - 1) * ITEMS_PER_PAGE,
    pageMost * ITEMS_PER_PAGE
  );
  const pagedLatest = latestDocs.slice(
    (pageLatest - 1) * ITEMS_PER_PAGE,
    pageLatest * ITEMS_PER_PAGE
  );

  return (
    <>
      <div className="ai-wrap">
        <div className="ai-header">
          <h1 className="ai-main-title">Tài Liệu Học Tập Thông Minh</h1>
          <p className="ai-subtitle">
            Trò chuyện với AI để hiểu sâu hơn về tài liệu học tập
          </p>
        </div>

        {/* Search + Filter */}
        <div className="ai-toolbar">
          <div className="ai-search">
            <span className="ai-search-icon">
              <SearchIcon />
            </span>
            <input
              placeholder="Tìm kiếm theo tên, mô tả hoặc tác giả..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <FilterDropdown
            isOpen={openFilter}
            selected={selected}
            onToggle={() => setOpenFilter((s) => !s)}
            onToggleCategory={toggleCategory}
            categories={categories}
          />
        </div>

        {/* Section 1: Most Used */}
        <div className="ai-section">
          <h3 className="ai-section-title">Được sử dụng nhiều nhất</h3>
          <div className="ai-grid">
            {pagedMost.map((d) => (
              <DocCard key={d.id} doc={d} onChat={openChat} />
            ))}
            {pagedMost.length === 0 && <p>Không có tài liệu phù hợp.</p>}
          </div>

          {totalMost > 1 && (
            <div className="ai-pagination">
              <button
                onClick={() => setPageMost((p) => Math.max(p - 1, 1))}
                disabled={pageMost === 1}
              >
                Trước
              </button>
              <span>
                Trang {pageMost}/{totalMost}
              </span>
              <button
                onClick={() => setPageMost((p) => Math.min(p + 1, totalMost))}
                disabled={pageMost === totalMost}
              >
                Sau
              </button>
            </div>
          )}
        </div>

        {/* Section 2: Latest */}
        {latestDocs.length > 0 && (
          <div className="ai-section">
            <h3 className="ai-section-title">Mới nhất</h3>
            <div className="ai-grid">
              {pagedLatest.map((d) => (
                <DocCard key={d.id} doc={d} onChat={openChat} />
              ))}
              {pagedLatest.length === 0 && <p>Không có tài liệu mới.</p>}
            </div>

            {totalLatest > 1 && (
              <div className="ai-pagination">
                <button
                  onClick={() => setPageLatest((p) => Math.max(p - 1, 1))}
                  disabled={pageLatest === 1}
                >
                  Trước
                </button>
                <span>
                  Trang {pageLatest}/{totalLatest}
                </span>
                <button
                  onClick={() =>
                    setPageLatest((p) => Math.min(p + 1, totalLatest))
                  }
                  disabled={pageLatest === totalLatest}
                >
                  Sau
                </button>
              </div>
            )}
          </div>
        )}
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
