import React, { useState, useCallback, useRef, useEffect } from "react";
import { askGemini } from "../../utils/geminiClient.js";
import { fetchDriveContentWithCache, truncateContent } from "../../utils/driveContentFetcher.js";

// Lưu theo môn học (industry/category) thay vì từng tài liệu
const getStorageKey = (industry) => `aiChatHistory_${industry}`;

const initialWelcomeMessage = (industry) => ({
  id: Date.now(),
  sender: "ai",
  text: `Xin chào! Tôi là trợ lý AI của môn ${industry}. Tôi có thể giúp gì cho bạn?`,
});

// Icon Components
const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24">
    <path
      d="M18 6L6 18M6 6l12 12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path
      d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TrashIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);


const Message = React.memo(({ msg }) => (
  <div className={`ai-chat-message ${msg.sender}`}>
    <div className="ai-chat-bubble">{msg.text}</div>
  </div>
));
Message.displayName = "Message";

// Main AI Chat Modal
export default function AiChatModal({ isOpen, onClose, docTitle, docData }) {
  const messagesEndRef = useRef(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const industry = docData?.industry;

  
  const [messages, setMessages] = useState(() => {
    if (!industry) return []; // Chỉ cần industry (môn học)

    const key = getStorageKey(industry);
    const savedHistory = localStorage.getItem(key);

    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        if (
          parsedHistory &&
          Array.isArray(parsedHistory) &&
          parsedHistory.length > 0
        ) {
          return parsedHistory;
        }
      } catch (e) {
        console.error("Lỗi khi tải lịch sử chat:", e);
      }
    }
  
    return [initialWelcomeMessage(industry)];
  });


  useEffect(() => {
    if (messages.length > 0 && industry) {
      const key = getStorageKey(industry);
      localStorage.setItem(key, JSON.stringify(messages));
    }
  }, [messages, industry]);


  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Xử lý khi industry thay đổi HOẶC khi mở modal (isOpen thay đổi)
  useEffect(() => {
    if (!industry || !isOpen) return;

    const key = getStorageKey(industry);
    const savedHistory = localStorage.getItem(key);

    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        if (
          parsedHistory &&
          Array.isArray(parsedHistory) &&
          parsedHistory.length > 0
        ) {
          setMessages(parsedHistory);
          return;
        }
      } catch (e) {
        console.error("Lỗi khi tải lịch sử chat:", e);
      }
    }
    
    setMessages([initialWelcomeMessage(industry)]);
  }, [industry, isOpen]);

  const handleClearChat = useCallback(() => {
    const isConfirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa toàn bộ lịch sử chat của môn ${industry} không?`
    );
    if (isConfirmed && industry) {
      const key = getStorageKey(industry);
      localStorage.removeItem(key); // Xóa khỏi localStorage
      setMessages([
        // Reset state về tin nhắn chào mừng
        {
          id: Date.now(),
          sender: "ai",
          text: `Lịch sử chat của môn ${industry} đã được xóa. Tôi có thể giúp gì cho bạn?`,
        },
      ]);
      setInput("");
    }
  }, [industry]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return;

    const userMsg = { id: Date.now(), sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput("");
    setLoading(true);

    try {
      // Lấy lịch sử hội thoại (5 tin nhắn gần nhất)
      const recentHistory = messages
        .slice(-5)
        .map((m) => `${m.sender === 'user' ? 'Người dùng' : 'Trợ lý AI'}: ${m.text}`)
        .join("\n");

      let aiPrompt;

      // Kiểm tra nếu có Drive URL, fetch nội dung thực tế (luôn tải mới)
      if (docData?.driveUrl) {
        try {
          console.log(`🔄 Đang tải nội dung mới nhất cho: ${docTitle}`);
          
          // LUÔN fetch mới từ Drive (forceRefresh = true)
          const result = await fetchDriveContentWithCache(docData.driveUrl, true);
          const driveContent = result.content;
          const truncatedContent = truncateContent(driveContent, 30000);

          // Thông báo cho user biết nguồn dữ liệu
          let dataSource = '';
          if (result.updated) {
            dataSource = '🔄 (dữ liệu mới nhất từ Drive)';
          } else if (result.fromCache) {
            dataSource = '💾 (cache - không thể cập nhật từ Drive)';
          }

          // Thêm warning nếu có
          const warningNote = result.warning 
            ? `\n⚠️ ${result.warning}\n` 
            : '';

          // Prompt với nội dung thực tế từ Drive
          aiPrompt = `Bạn là trợ lý học tập thông minh chuyên về môn ${docData.industry}. Nhiệm vụ của bạn là trả lời câu hỏi DỰA HOÀN TOÀN VÀO NỘI DUNG TÀI LIỆU được cung cấp.

📚 THÔNG TIN TÀI LIỆU HIỆN TẠI:
- Tiêu đề: ${docTitle}
- Mô tả: ${docData.desc || 'Không có'}
- Tác giả: ${docData.author || 'Không rõ'}
- Môn học: ${docData.industry || 'Không rõ'}

📄 NỘI DUNG ĐẦY ĐỦ TỪ TÀI LIỆU (${driveContent.length} ký tự) ${dataSource}:
================================================================================
${truncatedContent}
================================================================================
${warningNote}
${recentHistory ? `📝 LỊCH SỬ HỘI THOẠI GẦN ĐÂY:\n${recentHistory}\n\n` : ''}❓ CÂU HỎI MỚI:
${currentInput}

📋 QUY TẮC TRẢ LỜI (BẮT BUỘC):
1. ✅ CHỈ sử dụng thông tin từ nội dung tài liệu ở trên
2. ❌ KHÔNG bịa đặt hoặc thêm thông tin từ kiến thức chung của bạn
3. 📌 Trích dẫn cụ thể từ tài liệu khi có thể (dùng "...")
4. 🤔 Nếu câu hỏi không liên quan đến nội dung tài liệu, nói rõ: "Câu hỏi này không có trong tài liệu"
5. ⚠️ Nếu thông tin không đủ để trả lời chính xác, hãy thừa nhận thẳng thắn
6. 🇻🇳 Trả lời bằng tiếng Việt, rõ ràng, súc tích
7. 💡 Giải thích dễ hiểu, có ví dụ nếu cần

Hãy trả lời câu hỏi:`;

          console.log(`✅ Sử dụng ${driveContent.length} ký tự ${result.updated ? '(mới cập nhật)' : '(từ cache)'}`);
        } catch (driveError) {
          console.error('❌ Lỗi khi tải Drive content:', driveError);
          
          // Hiển thị lỗi chi tiết cho user
          const errorMessage = `${driveError.message}

📌 **Câu hỏi của bạn**: "${currentInput}"

Vì không thể truy cập tài liệu, tôi không thể trả lời chính xác. 

🔗 Bạn có thể:
• Nhấn nút **Drive** ở card tài liệu để mở và đọc trực tiếp
• **Copy toàn bộ nội dung** từ Drive và paste vào đây, tôi sẽ trả lời ngay
• Liên hệ admin để kiểm tra cấu hình file`;

          setMessages((prev) => [
            ...prev,
            { id: Date.now() + 1, sender: "ai", text: errorMessage },
          ]);
          setLoading(false);
          return;
        }
      } else {
        // Không có Drive URL - kiểm tra xem user có paste nội dung dài không
        const isLongContent = currentInput.length > 500;
        
        if (isLongContent) {
          // User có thể đã paste nội dung tài liệu vào
          aiPrompt = `Bạn là trợ lý học tập môn ${docData.industry}. Đang tham khảo tài liệu "${docTitle}".

Người dùng đã cung cấp nội dung sau (có thể là từ tài liệu):

📄 NỘI DUNG:
${currentInput}

Hãy phân tích nội dung này và:
1. Tóm tắt các ý chính
2. Giải thích các khái niệm quan trọng
3. Trả lời câu hỏi nếu có
4. Đưa ra nhận xét và gợi ý học tập

Trả lời bằng tiếng Việt, rõ ràng và có cấu trúc:`;
        } else {
          // Câu hỏi ngắn không có Drive URL
          aiPrompt = `Bạn là trợ lý học tập môn ${docData.industry}. Đang tham khảo tài liệu "${docTitle}".

${recentHistory ? `📝 LỊCH SỬ:\n${recentHistory}\n\n` : ''}❓ CÂU HỎI:
${currentInput}

⚠️ **Lưu ý**: Tài liệu hiện tại chưa có link Drive hoặc tôi chưa truy cập được nội dung đầy đủ.

Tôi sẽ trả lời dựa trên:
- Kiến thức chung về môn ${docData.industry}
- Thông tin từ tiêu đề/mô tả tài liệu
- Ngữ cảnh cuộc trò chuyện trước đó của môn này

💡 **Để câu trả lời chính xác hơn**, bạn có thể:
1. Paste đoạn văn bản từ tài liệu vào đây
2. Hỏi câu hỏi cụ thể hơn về nội dung môn học

Hãy trả lời bằng tiếng Việt:`;
        }
      }

      const reply = await askGemini(aiPrompt);

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: "ai", text: reply },
      ]);
    } catch (error) {
      console.error("Error in handleSend:", error);
      
      const errorMessage = `❌ Đã xảy ra lỗi: ${error.message}. Vui lòng thử lại sau.`;
      
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: "ai", text: errorMessage },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, docTitle, docData, messages]);

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  if (!isOpen) return null;

  return (
    <div className="ai-chat-overlay" onClick={onClose}>
      <div className="ai-chat-box" onClick={(e) => e.stopPropagation()}>
        <div className="ai-chat-header">
          <div>
            <h3>Chat với AI - {industry}</h3>
            <p>📄 {docTitle}</p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            {/* --- NÚT XÓA LỊCH SỬ CHAT CỦA MÔN HỌC --- */}
            {messages.length > 1 && (
              <button
                className="ai-chat-close"
                onClick={handleClearChat}
                title={`Xóa lịch sử chat môn ${industry}`}
              >
                <TrashIcon />
              </button>
            )}
            <button className="ai-chat-close" onClick={onClose}>
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="ai-chat-messages">
          {messages.map((msg) => (
            <Message key={msg.id} msg={msg} />
          ))}
          {loading && (
            <div className="ai-chat-message ai">
              <div className="ai-chat-bubble">Đang trả lời...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="ai-chat-input-area">
          <input
            type="text"
            placeholder="Nhập tin nhắn..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
          <button onClick={handleSend} disabled={loading}>
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
