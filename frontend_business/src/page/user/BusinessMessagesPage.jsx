import React, { useEffect, useRef, useState } from "react";
import "../../css/MessagesPage.css";
import axios from "axios";
import { io } from "socket.io-client";
import { useUser } from "@clerk/clerk-react";
// 1. Import hook useNavigate
import { useNavigate } from "react-router-dom";
import { IoSend, IoClose } from "react-icons/io5";
import { FaPlus } from "react-icons/fa";
import { FaPhoneAlt } from "react-icons/fa";
import { HiVideoCamera } from "react-icons/hi2";
import { FaInfoCircle } from "react-icons/fa";

// ===============================
//  Modal Component (Tìm sinh viên)
// (Giữ nguyên, không thay đổi)
// ===============================
const NewChatModal = ({
  isOpen,
  onClose,
  studentList,
  onSelectStudent,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  if (!isOpen) return null;
  const filteredList = studentList.filter((student) =>
    (student.fullName || "Student")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="business-mess-modal-overlay">
      <div className="business-mess-modal-content">
        <div className="business-mess-modal-header">
          <h2>Bắt đầu trò chuyện với sinh viên</h2>
          <button onClick={onClose} className="business-mess-modal-close-btn">
            <IoClose />
          </button>
        </div>
        <div className="business-mess-search-wrapper">
          <input
            type="text"
            placeholder="Tìm kiếm sinh viên..."
            className="business-mess-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="business-mess-modal-list">
          {filteredList.map((student) => (
            <div
              key={student.id}
              className="business-mess-chat-item"
              onClick={() => {
                onSelectStudent(student);
                onClose();
              }}
            >
              <div className="business-mess-avatar-wrapper">
                <img
                  src={student.imageUrl || "/default-avatar.png"}
                  alt="avatar"
                  className="business-mess-avatar"
                />
              </div>
              <div className="business-mess-chat-info">
                <p className="business-mess-chat-name">
                  {student.fullName || "Student User"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ===============================
//  Main Page Component
// ===============================
const BusinessMessagesPage = () => {
  const { user } = useUser();
  const [conversations, setConversations] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [responseType, setResponseType] = useState("Manager");
  const [showMenu, setShowMenu] = useState(false);
  
  // 2. Thêm state và hook mới
  const [hasBotAccess, setHasBotAccess] = useState(false); // State theo dõi quyền truy cập
  const navigate = useNavigate(); // Hook để chuyển hướng

  const dropdownRef = useRef(null);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const businessId = user?.id;

  useEffect(() => {
    if (!businessId) return;
    socketRef.current = io(`${import.meta.env.VITE_BE_URL}`, {
      transports: ["websocket"],
    });
    socketRef.current.emit("join", businessId);
    socketRef.current.on("receive_message", (msg) => {
      if (msg.sender_id === selectedStudent?.id) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            type: "received",
            content: msg.message,
            time: new Date(msg.ts).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
      }
    });
    return () => socketRef.current.disconnect();
  }, [businessId, selectedStudent]);

  // ... (useEffect cho việc tải DS chat & sinh viên vẫn giữ nguyên) ...
  useEffect(() => {
    const fetchConversations = async () => { /* ... */ };

    const fetchAllStudents = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BE_URL}/api/user`
        );
        const allUsers = res.data.users || [];
        const studentsOnly = allUsers.filter(user => user.role === 'client');
        setAllStudents(studentsOnly);
      } catch (err) {
        console.error("Error fetching all students:", err);
      }
    };

    fetchConversations();
    fetchAllStudents();
  }, [businessId]);

  // 3. useEffect MỚI để kiểm tra quyền truy cập Bot
  useEffect(() => {
    if (!businessId) return;

    const checkBotAccess = async () => {
      try {
        // Gọi API thanh toán
        const res = await axios.get(
          `${import.meta.env.VITE_BE_URL}/api/payment/userid/${businessId}`
        );

        // Giả sử API trả về { payments: [...] }
        const payments = res.data.data || []; 

        console.log(payments);
        
        
        // Kiểm tra điều kiện
        const hasValidPayment = payments.some(payment => 
          payment.payment_stack?.stack_name.toLowerCase() === "bot tư vấn viên" &&
          payment.payment_status === "completed"
        );

        setHasBotAccess(hasValidPayment);

      } catch (err) {
        console.error("Lỗi khi kiểm tra thanh toán bot:", err);
        setHasBotAccess(false); // Mặc định là không có quyền nếu lỗi
      }
    };

    checkBotAccess();
  }, [businessId]); // Chạy lại khi có businessId

  // ... (handleSendMessage & handleSelectStudent giữ nguyên) ...
  const handleSendMessage = () => {
    if (!message.trim() || !selectedStudent || !businessId) return;

    const chatId = `${selectedStudent.id}_${businessId}`;
    const newMsg = {
      id: Date.now(),
      type: "sent",
      content: message,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, newMsg]);
    setMessage("");

    // Nếu là Bot và có quyền, gửi tin nhắn kiểu 'bot'
    if (responseType === 'Bot' && hasBotAccess) {
      // Lưu ý: Backend của bạn hiện tại chỉ hỗ trợ 'bot' khi sinh viên
      // gửi. Bạn có thể cần sửa backend để hỗ trợ 'bot' khi business gửi.
      // Tạm thời, chúng ta vẫn gửi như 'human'
      console.warn("Đã chọn Bot, nhưng đang gửi như Manager. Cần sửa backend nếu muốn bot trả lời.");
      socketRef.current.emit("send_message_socket", {
        chatId,
        sender_id: businessId,
        receiver_id: selectedStudent.id,
        message,
      });

    } else {
      // Gửi như 'human' (Manager)
      socketRef.current.emit("send_message_socket", {
        chatId,
        sender_id: businessId,
        receiver_id: selectedStudent.id,
        message,
      });
    }
  };

  const handleSelectStudent = async (student) => {
    setSelectedStudent(student);
    setMessages([]);
    if (!businessId) return;

    try {
      const res = await axios.request({
        method: "post",
        url: `${import.meta.env.VITE_BE_URL}/api/conversation/check`,
        data: {
          sender_id: student.id,
          receiver_id: businessId,
        },
      });

      const chatHistory = res.data.history || [];
      const formattedHistory = chatHistory.map((msg) => ({
        id: msg.ts,
        type: msg.sender_id === businessId ? "sent" : "received",
        content: msg.message,
        time: new Date(msg.ts).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));
      setMessages(formattedHistory);
    } catch (err) {
      console.error("Error fetching chat history:", err);
      setMessages([]);
    }
  };

  // ... (Các hook và handler phụ trợ) ...
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelectDropdown = (type) => {
    setResponseType(type);
    setShowMenu(false);
  };
  
  // 4. Handler MỚI cho việc nhấp vào tùy chọn Bot
  const handleBotOptionClick = () => {
    if (hasBotAccess) {
      // Nếu có quyền, chỉ cần chọn
      handleSelectDropdown("Bot");
    } else {
      // Nếu không có quyền, đóng menu và chuyển hướng
      setShowMenu(false);
      navigate("/business-dashboard/my-ai");
    }
  };

  return (
    <>
      <NewChatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        studentList={allStudents}
        onSelectStudent={handleSelectStudent}
      />

      <div className="business-mess-container">
        {/* Sidebar */}
        <div className="business-mess-sidebar">
          <div className="business-mess-sidebar-header">
            <h2 className="business-mess-sidebar-title">Tin nhắn</h2>
            <button
              className="business-mess-new-chat-btn"
              onClick={() => setIsModalOpen(true)}
            >
              <FaPlus />
            </button>
          </div>
          <div className="business-mess-chat-list">
            {conversations.map((convo) => (
              <div
                key={convo.student.id}
                className={`business-mess-chat-item ${
                  selectedStudent?.id === convo.student.id ? "active" : ""
                }`}
                onClick={() => handleSelectStudent(convo.student)}
              >
                <div className="business-mess-avatar-wrapper">
                  <img
                    src={convo.student.imageUrl || "/default-avatar.png"}
                    alt="avatar"
                    className="business-mess-avatar"
                  />
                </div>
                <div className="business-mess-chat-info">
                  <p className="business-mess-chat-name">
                    {convo.student.fullName}
                  </p>
                  <p className="business-mess-chat-status">
                    {convo.lastMessage}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat window */}
        <div className="business-mess-window">
          {selectedStudent ? (
            <>
              <div className="business-mess-header">
                {/* ... (Header giữ nguyên) ... */}
                <div className="business-mess-header-left">
                  <img
                    src={selectedStudent.imageUrl || "/default-avatar.png"}
                    alt="avatar"
                    className="business-mess-avatar"
                  />
                  <div>
                    <h4>{selectedStudent.fullName}</h4>
                  </div>
                </div>
              </div>

              <div className="business-mess-body">
                {/* ... (Body giữ nguyên) ... */}
                {messages.map((msg) => (
                  <div key={msg.id} className={`business-mess-row ${msg.type === 'sent' ? 'right' : 'left'}`}>
                    <div className="business-mess-message">
                      {msg.content}
                    </div>
                    <span className="business-mess-time">{msg.time}</span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="business-mess-input">
                <div className="business-mess-dropdown" ref={dropdownRef}>
                  <button
                    className="business-mess-more-btn"
                    onClick={() => setShowMenu((prev) => !prev)}
                  >
                    {responseType}
                  </button>
                  
                  {/* 5. Cập nhật JSX của dropdown */}
                  {showMenu && (
                    <div className="business-mess-dropdown-menu">
                      <div
                        className={responseType === "Manager" ? "active" : ""}
                        onClick={() => handleSelectDropdown("Manager")}
                      >
                        Manager
                      </div>
                      <div
                        className={responseType === "Bot" ? "active" : ""}
                        // Thêm class 'disabled' nếu không có quyền
                        disabled={!hasBotAccess} 
                        onClick={handleBotOptionClick} // Dùng handler mới
                      >
                        Bot
                        {!hasBotAccess && (
                          <span className="upgrade-tooltip"> (Nâng cấp)</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <input 
                  type="text" 
                  placeholder={`Send as ${responseType}...`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <button 
                  className="business-mess-send-btn"
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                >
                  <IoSend />
                </button>
              </div>
            </>
          ) : (
            <div className="business-mess-placeholder">
              <p>💬 Chọn một sinh viên để bắt đầu trò chuyện</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BusinessMessagesPage;