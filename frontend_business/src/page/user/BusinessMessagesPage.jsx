import React, { useEffect, useRef, useState } from "react";
import "../../css/MessagesPage.css";
import axios from "axios";
import { io } from "socket.io-client"; // Import io
import { useUser } from "@clerk/clerk-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { IoSend, IoClose } from "react-icons/io5";
import { FaPlus } from "react-icons/fa";
import LoadingScreen from "../../components/LoadingScreen";

const NOTI_STORAGE_KEY = "allNotifications";

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
              key={student.clerkId}
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

const BusinessMessagesPage = () => {
  const { user } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [responseType, setResponseType] = useState("Manager");
  const [showMenu, setShowMenu] = useState(false);
  const [hasBotAccess, setHasBotAccess] = useState(false);
  const navigate = useNavigate();
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
    socketRef.current.emit("join", businessId);

    socketRef.current.on("receive_message", (msg) => {
      const studentIdInConvo =
        msg.sender_id === businessId ? msg.receiver_id : msg.sender_id;

      if (studentIdInConvo === selectedStudent?.clerkId) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            type: msg.sender_id === businessId ? "sent" : "received",
            content: msg.message,
            time: new Date(msg.ts).toLocaleString([], {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
      }

      setConversations((prevConvos) => {
        const convoIndex = prevConvos.findIndex(
          (c) => c.student?.clerkId === studentIdInConvo
        );

        if (convoIndex === -1) {
          const studentInfo = allStudents.find(
            (s) => s.clerkId === studentIdInConvo
          );

          if (studentInfo) {
            const newConvo = {
              student: studentInfo,
              lastMessage: msg.message,
              lastMessageSenderId: msg.sender_id,
            };
            return [newConvo, ...prevConvos];
          }
          return prevConvos;
        }

        const updatedConvo = {
          ...prevConvos[convoIndex],
          lastMessage: msg.message,
          lastMessageSenderId: msg.sender_id,
        };

        const newConvos = [
          updatedConvo,
          ...prevConvos.slice(0, convoIndex),
          ...prevConvos.slice(convoIndex + 1),
        ];
        return newConvos;
      });
    });

    return () => socketRef.current.disconnect();
  }, [businessId, selectedStudent, allStudents]);

  useEffect(() => {
    if (!businessId) return;

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

    const loadAndProcessData = async () => {
      setIsLoading(true); // Bắt đầu loading

      const [students, histories] = await Promise.all([
        fetchAllStudents(),
        fetchHistories(),
      ]);

      if (histories.length === 0) {
        setConversations([]);
        setIsLoading(false);
        return;
      }

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

      setConversations(processedConversations);
      setIsLoading(false);
    };

    loadAndProcessData();
  }, [businessId]);

  useEffect(() => {
    const studentIdFromUrl = searchParams.get("studentId");

    if (studentIdFromUrl && !isLoading && allStudents.length > 0) {
      const studentToSelect = allStudents.find(
        (s) => s.clerkId === studentIdFromUrl
      );

      if (studentToSelect) {
        handleSelectStudent(studentToSelect);

        setSearchParams({}, { replace: true });
      }
    }
  }, [isLoading, allStudents, searchParams, setSearchParams]);

  useEffect(() => {
    if (!businessId) return;

    const checkBotAccess = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BE_URL}/api/aibot/owner/${businessId}`
        );

        const aibot = res.data;
        const hasAnyBot = !!aibot;
        if (hasAnyBot) setHasBotAccess("haveBot");
        if (aibot.knowledge.length > 0) {
          setHasBotAccess("haveKnowledge");
          setResponseType("Bot");
        }
      } catch (err) {
        console.error("Lỗi khi kiểm tra sở hữu aibot:", err);
        setHasBotAccess(false);
      }
    };

    checkBotAccess();
  }, [businessId]);

  const handleSendMessage = () => {
    if (!message.trim() || !selectedStudent || !businessId) return;

    const chatId = `${selectedStudent.clerkId}_${businessId}`;
    const newMsg = {
      id: Date.now(),
      type: "sent",
      content: message,
      time: new Date().toLocaleString([], {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const sentMessageContent = message;

    setMessages((prev) => [...prev, newMsg]);
    setMessage("");

    if (responseType === "Bot" && hasBotAccess == "haveKnowledge") {
      socketRef.current.emit("send_message_socket", {
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
        (c) => c.student?.clerkId === selectedStudent.clerkId
      );

      if (convoIndex === -1) {
        const newConvo = {
          student: selectedStudent,
          lastMessage: sentMessageContent,
          lastMessageSenderId: businessId,
        };
        return [newConvo, ...prevConvos];
      }

      const updatedConvo = {
        ...prevConvos[convoIndex],
        lastMessage: sentMessageContent,
        lastMessageSenderId: businessId,
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

    try {
      const storedNotis = localStorage.getItem(NOTI_STORAGE_KEY);
      if (storedNotis) {
        let notifications = JSON.parse(storedNotis);
        const updatedNotis = notifications.filter(
          (noti) => noti.sender_id !== student.clerkId
        );

        localStorage.setItem(NOTI_STORAGE_KEY, JSON.stringify(updatedNotis));
      }
    } catch (err) {
      console.error("Lỗi khi xóa thông báo:", err);
    }
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
        time: new Date(msg.ts).toLocaleString([], {
          day: "2-digit",
          month: "2-digit",
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

  useEffect(() => {
    const handleStorageUpdate = () => {
      const storedNotis = localStorage.getItem(NOTI_STORAGE_KEY);
      setNotifications(storedNotis ? JSON.parse(storedNotis) : []);
    };

    window.addEventListener("notificationsUpdated", handleStorageUpdate);

    return () => {
      window.removeEventListener("notificationsUpdated", handleStorageUpdate);
    };
  }, []);

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
    if (hasBotAccess == "haveKnowledge") {
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

      {isLoading ? (
        <div className="business-mess-placeholder-fullpage">
          <LoadingScreen />
        </div>
      ) : conversations.length === 0 ? (
        <div className="business-mess-placeholder-fullpage">
          <p>💬 Bạn chưa có cuộc trò chuyện nào.</p>
        </div>
      ) : (
        <div className="business-mess-container">
          <div className="business-mess-sidebar">
            <div className="business-mess-sidebar-header">
              <h2 className="business-mess-sidebar-title">Tin nhắn</h2>
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
                          className={responseType === "Bot" ? "active" : ""}
                          disabled={!hasBotAccess}
                          onClick={handleBotOptionClick}
                        >
                          Bot
                          {!hasBotAccess && (
                            <span className="upgrade-tooltip"> (Nâng cấp)</span>
                          )}
                          {hasBotAccess == "haveBot" && (
                            <span className="upgrade-tooltip">
                              {" "}
                              (Chưa có cấu hình bot)
                            </span>
                          )}
                        </div>
                        <div
                          className={responseType === "Manager" ? "active" : ""}
                          onClick={() => handleSelectDropdown("Manager")}
                        >
                          Manager
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
                    disabled={responseType == "Bot"}
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
