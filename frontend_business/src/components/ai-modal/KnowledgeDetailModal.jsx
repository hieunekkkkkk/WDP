import React from "react";
import "../../components/ai-support/style/KnowledgePage.css";

const KnowledgeDetailModal = ({ knowledge, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <h2 style={{margin: 0}}>Chi tiết kiến thức</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {knowledge.tags?.length > 0 && (
          <p>
            <b>Loại:</b> {knowledge.type === "link" ? "Liên kết" : "Văn bản"}
          </p>
        )}
        <br></br>
        <p>
          <b>Nội dung:</b>
        </p>
        <pre className="knowledge-content">{knowledge.content}</pre>
      </div>
    </div>
  );
};

export default KnowledgeDetailModal;
