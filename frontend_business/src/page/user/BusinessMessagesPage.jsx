import React, { useEffect, useRef, useState } from "react";
import "../../css/MessagesPage.css";
import axios from "axios";
import { io } from "socket.io-client"; // Import io
import { useUser } from "@clerk/clerk-react";
// 1. Import hook useNavigate
import { useNavigate } from "react-router-dom";
import { IoSend, IoClose } from "react-icons/io5";
import { FaPlus } from "react-icons/fa";
import LoadingScreen from "../../components/LoadingScreen";

const NewChatModal = ({ isOpen, onClose, studentList, onSelectStudent }) => {
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
// Main Page Component
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
  const [showMenu, setShowMenu] = useState(false); // 2. Thêm state và hook mới

  const [hasBotAccess, setHasBotAccess] = useState(false); // State theo dõi quyền truy cập
  const navigate = useNavigate(); // Hook để chuyển hướng
  const [isLoading, setIsLoading] = useState(true);

  const dropdownRef = useRef(null);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const businessId = user?.id;

  useEffect(() => {
    if (!businessId) return;
    socketRef.current = io(`${import.meta.env.VITE_BE_URL}`, {
      transports: ["websocket"],
    });
    socketRef.current.emit("join", businessId); // =============================================== //  CHANGE 2: CẬP NHẬT SIDEBAR KHI NHẬN TIN NHẮN // ===============================================

    socketRef.current.on("receive_message", (msg) => {
      // Cập nhật cửa sổ chat nếu đang mở
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
      } // Cập nhật tin nhắn cuối trong sidebar

      setConversations((prevConvos) => {
        // Tìm convo bằng ID sinh viên (người gửi)
        const convoIndex = prevConvos.findIndex(
          (c) => c.student?.id === msg.sender_id
        ); // Nếu là chat mới (sinh viên nhắn trước)

        if (convoIndex === -1) {
          // Thử tìm thông tin sinh viên từ list đã tải
          const studentInfo = allStudents.find((s) => s.id === msg.sender_id);

          if (studentInfo) {
            const newConvo = {
              student: studentInfo,
              lastMessage: msg.message,
              lastMessageSenderId: msg.sender_id, // Người gửi là sinh viên
            };
            return [newConvo, ...prevConvos];
          } // Không tìm thấy info, không thêm vào sidebar
          return prevConvos;
        } // Nếu chat đã có, cập nhật và đưa lên đầu

        const updatedConvo = {
          ...prevConvos[convoIndex],
          lastMessage: msg.message,
          lastMessageSenderId: msg.sender_id, // Người gửi là sinh viên
        };

        const newConvos = [
          updatedConvo,
          ...prevConvos.slice(0, convoIndex),
          ...prevConvos.slice(convoIndex + 1),
        ];
        return newConvos;
      });
    });
    return () => socketRef.current.disconnect(); // Thêm allStudents vào dependency array
  }, [businessId, selectedStudent, allStudents]); // ==================================================================== // useEffect để tải danh sách chat VÀ danh sách sinh viên // ====================================================================

  // ====================================================================
  // useEffect để tải danh sách chat VÀ danh sách sinh viên
  // ====================================================================
  useEffect(() => {
    if (!businessId) return;

    // 1. Hàm tải TẤT CẢ sinh viên (Giữ nguyên)
    const fetchAllStudents = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BE_URL}/api/user`);
        const allUsers = res.data.users || [];
        const studentsOnly = allUsers.filter((user) => user.role === "client");
        setAllStudents(studentsOnly);
        return studentsOnly;
      } catch (err) {
        console.error("Error fetching all students:", err);
        return [];
      }
    };

    // 2. Hàm tải LỊCH SỬ các cuộc trò chuyện (Giữ nguyên)
    const fetchHistories = async () => {
      try {
        const res = await axios.get(
          `${
            import.meta.env.VITE_BE_URL
          }/api/conversation/user/${businessId}/histories`
        );
        return res.data || [];
      } catch (err) {
        console.error("Error fetching conversation histories:", err);
        return [];
      }
    };

    // 3. Hàm kết hợp cả hai nguồn dữ liệu (ĐÃ SỬA LỖI)
    const loadAndProcessData = async () => {
      setIsLoading(true); // Bắt đầu loading

      // Chạy song song 2 API
      const [students, histories] = await Promise.all([
        fetchAllStudents(),
        fetchHistories(),
      ]);

      // === SỬA LỖI LOGIC TẠI ĐÂY ===
      // Nếu không có lịch sử, set mảng rỗng VÀ TẮT LOADING
      if (histories.length === 0) {
        setConversations([]);
        setIsLoading(false); // <-- PHẢI TẮT LOADING Ở ĐÂY
        return; // An toàn return
      }
      // === KẾT THÚC SỬA LỖI ===

      // Nếu có histories, tiếp tục xử lý
      const studentMap = new Map();
      students.forEach((student) => {
        studentMap.set(student.clerkId, student);
      });

      const processedConversations = histories
        .map((history) => {
          const ids = history.chatId.split("_");
          if (ids.length < 4) return null;

          const userId1 = ids[1];
          const userId2 = ids[3];
          const studentId = userId1 === businessId ? userId2 : userId1;
          const studentInfo = studentMap.get("user_" + studentId);

          let lastMessage = "Chưa có tin nhắn";
          let lastMessageSenderId = null;
          if (history.conversation && history.conversation.length > 0) {
            const lastMessageObject =
              history.conversation[history.conversation.length - 1];
            lastMessage = lastMessageObject.message;
            lastMessageSenderId = lastMessageObject.sender_id;
          }

          if (studentInfo) {
            return {
              student: studentInfo,
              lastMessage: lastMessage,
              lastMessageSenderId: lastMessageSenderId,
            };
          }
          return null;
        })
        .filter(Boolean);

      // 5. Cập nhật state và TẮT LOADING
      setConversations(processedConversations);
      setIsLoading(false); // Tắt loading sau khi xử lý xong
    };

    loadAndProcessData();
  }, [businessId]); // Chỉ chạy lại khi businessId thay đổi

  useEffect(() => {
    if (!businessId) return;

    const checkBotAccess = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BE_URL}/api/payment/userid/${businessId}`
        );
        const payments = res.data.data || [];

        const hasValidPayment = payments.some(
          (payment) =>
            payment.payment_stack?.stack_name.toLowerCase() ===
              "bot tư vấn viên" && payment.payment_status === "completed"
        );
        setHasBotAccess(hasValidPayment);
      } catch (err) {
        console.error("Lỗi khi kiểm tra thanh toán bot:", err);
        setHasBotAccess(false);
      }
    };
    checkBotAccess();
  }, [businessId]); // =============================================== //  CHANGE 3: CẬP NHẬT SIDEBAR KHI GỬI TIN NHẮN // ===============================================

  const handleSendMessage = () => {
    if (!message.trim() || !selectedStudent || !businessId) return;

    const chatId = `${selectedStudent.clerkId}_${businessId}`;
    const newMsg = {
      id: Date.now(),
      type: "sent",
      content: message,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const sentMessageContent = message; // Lưu lại nội dung trước khi clear

    setMessages((prev) => [...prev, newMsg]);
    setMessage(""); // Clear input

    if (responseType === "Bot" && hasBotAccess) {
      console.warn("Đã chọn Bot, nhưng đang gửi như Manager...");
      socketRef.current.emit("send_message_bot", {
        chatId,
        sender_id: businessId,
        receiver_id: selectedStudent.clerkId,
        message: sentMessageContent,
      });
    } else {
      socketRef.current.emit("send_message_socket", {
        chatId,
        sender_id: businessId,
        receiver_id: selectedStudent.clerkId,
        message: sentMessageContent,
      });
    }

    setConversations((prevConvos) => {
      const convoIndex = prevConvos.findIndex(
        (c) => c.student?.id === selectedStudent.id
      ); // Nếu là chat mới (chưa có trong list sidebar)

      if (convoIndex === -1) {
        const newConvo = {
          student: selectedStudent, // Dùng object student đang chọn
          lastMessage: sentMessageContent,
          lastMessageSenderId: businessId, // Bạn (business) là người gửi
        };
        return [newConvo, ...prevConvos];
      } // Nếu là chat đã có, cập nhật và đưa lên đầu

      const updatedConvo = {
        ...prevConvos[convoIndex],
        lastMessage: sentMessageContent,
        lastMessageSenderId: businessId, // Bạn (business) là người gửi
      };

      const newConvos = [
        updatedConvo,
        ...prevConvos.slice(0, convoIndex),
        ...prevConvos.slice(convoIndex + 1),
      ];
      return newConvos;
    });
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
          sender_id: student.clerkId,
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
  }; // ... (Các hook và handler phụ trợ) ...

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
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

  const handleBotOptionClick = () => {
    if (hasBotAccess) {
      handleSelectDropdown("Bot");
    } else {
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

      {/* Phần logic được cập nhật: 
      Kiểm tra 3 trạng thái: Đang tải, Tải xong (trống), Tải xong (có data)
    */}
      {isLoading ? (
        // 1. Trạng thái ĐANG TẢI
        <div className="business-mess-placeholder-fullpage">
          <LoadingScreen />
          {/* Bạn có thể thêm spinner ở đây */}
        </div>
      ) : conversations.length === 0 ? (
        // 2. Tải xong nhưng KHÔNG CÓ tin nhắn
        <div className="business-mess-placeholder-fullpage">
          <p>💬 Bạn chưa có cuộc trò chuyện nào.</p>
        </div>
      ) : (
        // 3. Tải xong và CÓ tin nhắn (hiển thị container)
        <div className="business-mess-container">
          {/* Sidebar */}
          <div className="business-mess-sidebar">
            <div className="business-mess-sidebar-header">
              <h2 className="business-mess-sidebar-title">Tin nhắn</h2>
              {/* Nút này được bỏ comment để bạn có thể thêm chat mới */}
              {/* <button
                className="business-mess-new-chat-btn"
                onClick={() => setIsModalOpen(true)}
                title="Tạo tin nhắn mới"
              >
                <FaPlus />
              </button> */}
            </div>

            <div className="business-mess-chat-list">
              {conversations.map((convo) => (
                <div
                  key={convo.student.clerkId}
                  className={`business-mess-chat-item ${
                    selectedStudent?.clerkId === convo.student.clerkId
                      ? "active"
                      : ""
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
                      {convo.lastMessageSenderId === businessId ? "Bạn: " : ""}
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
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`business-mess-row ${
                        msg.type === "sent" ? "right" : "left"
                      }`}
                    >
                      <div className="business-mess-message">{msg.content}</div>
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
                          disabled={!hasBotAccess}
                          onClick={handleBotOptionClick}
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
      )}
    </>
  );
};

export default BusinessMessagesPage;
