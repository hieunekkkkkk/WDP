import React, { useEffect, useRef, useState, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import { IoSend, IoClose } from "react-icons/io5";
import LoadingScreen from "../../components/LoadingScreen";
import "../../css/MessagesPage.css";

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
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [responseType, setResponseType] = useState("Manager");
  const [showMenu, setShowMenu] = useState(false);
  const [hasBotAccess, setHasBotAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentChatId, setCurrentChatId] = useState(null);

  const dropdownRef = useRef(null);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const currentChatIdRef = useRef(null);
  const roomJoinedRef = useRef(false); // Track room join status
  const businessId = user?.id;

  // Khởi tạo socket - CHỈ PHỤ THUỘC businessId
  useEffect(() => {
    if (!businessId) return;

    socketRef.current = io(`${import.meta.env.VITE_BE_URL}`, {
      transports: ["websocket"],
    });

    socketRef.current.on("connect", () => {
      // Re-join room if we were in a chat
      if (currentChatIdRef.current) {
        socketRef.current.emit("join_chat", currentChatIdRef.current);
      }
    });

    socketRef.current.on("receive_message", (msg) => {
      if (msg.sender_id === businessId) {
        return;
      }

      // Cập nhật messages nếu thuộc chat hiện tại
      setMessages((prev) => {
        // Kiểm tra message thuộc chat nào
        const belongsToCurrentChat = msg.chatId === currentChatIdRef.current;

        if (!belongsToCurrentChat) {
          return prev;
        }

        const exists = prev.some((m) => m.id === msg.ts);
        if (exists) {
          return prev;
        }

        const messageType = "received";

        return [
          ...prev,
          {
            id: msg.ts,
            content: msg.message,
            type: messageType,
            time: new Date(msg.ts).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ];
      });

      if (msg.sender_id === businessId || msg.receiver_id === businessId) {
        setConversations((prevConvos) => {
          const studentId =
            msg.sender_id === businessId ? msg.receiver_id : msg.sender_id;
          const convoIndex = prevConvos.findIndex(
            (c) => c.senderId === studentId || c.receiverId === studentId
          );

          if (convoIndex === -1) {
            console.warn("⚠️ Conversation not found in list!");
            return prevConvos;
          }

          const updatedConvo = {
            ...prevConvos[convoIndex],
            lastMessage: msg.message,
            lastMessageSenderId: msg.sender_id,
          };

          return [
            updatedConvo,
            ...prevConvos.slice(0, convoIndex),
            ...prevConvos.slice(convoIndex + 1),
          ];
        });
      }
    });

    return () => socketRef.current?.disconnect();
  }, [businessId]);

  // Kiểm tra bot access
  useEffect(() => {
    if (!businessId) return;

    const checkBotAccess = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BE_URL}/api/aibot/owner/${businessId}`
        );

        const bot = res.data;

        if (!bot || !bot.id) {
          setHasBotAccess(false);
          return;
        }

        if (
          bot.knowledge &&
          Array.isArray(bot.knowledge) &&
          bot.knowledge.length > 0
        ) {
          setHasBotAccess("haveKnowledge");
        } else {
          setHasBotAccess("haveBot");
        }
      } catch (err) {
        console.error("Error checking bot access:", err);
        setHasBotAccess(false);
      }
    };

    checkBotAccess();
  }, [businessId]);

  // Load students list
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BE_URL}/api/user?role=client`
        );
        setAllStudents(res.data.users || []);
      } catch (err) {
        console.error("Error fetching students:", err);
      }
    };
    fetchStudents();
  }, []);

  // Load conversations history
  useEffect(() => {
    if (!businessId) return;

    const loadHistories = async () => {
      try {
        const res = await axios.get(
          `${
            import.meta.env.VITE_BE_URL
          }/api/conversation/user/${businessId}/histories`
        );

        const convos = await Promise.all(
          res.data.map(async (conv) => {
            const studentId =
              conv.senderId === businessId ? conv.receiverId : conv.senderId;

            try {
              const studentRes = await axios.get(
                `${import.meta.env.VITE_BE_URL}/api/user/${studentId}`
              );

              const studentData =
                studentRes.data.user ||
                studentRes.data.users ||
                studentRes.data;

              if (!studentData) {
                console.warn(`Student not found for ID: ${studentId}`);
                return null;
              }

              const lastMsg = conv.conversation[conv.conversation.length - 1];

              return {
                chatId: conv.chatId,
                senderId: conv.senderId,
                receiverId: conv.receiverId,
                type: conv.type,
                student: studentData,
                lastMessage: lastMsg?.message || "",
                lastMessageSenderId: lastMsg?.sender_id || "",
              };
            } catch (err) {
              console.error(`Error fetching student ${studentId}:`, err);
              return null;
            }
          })
        );

        setConversations(convos.filter(Boolean));
        setIsLoading(false);
      } catch (err) {
        console.error("Error loading histories:", err);
        setIsLoading(false);
      }
    };

    loadHistories();
  }, [businessId]);

  // Chọn student và load conversation
  const handleSelectStudent = useCallback(
    async (student) => {
      if (!businessId || !student) return;

      setSelectedStudent(student);
      setMessages([]);
      roomJoinedRef.current = false; // Reset room join status

      const studentId = student.clerkId || student.id;

      try {
        const res = await axios.post(
          `${import.meta.env.VITE_BE_URL}/api/conversation/check`,
          {
            sender_id: studentId,
            receiver_id: businessId,
          }
        );

        const { chatId, type, history } = res.data;
        setCurrentChatId(chatId);
        currentChatIdRef.current = chatId; // Sync ref

        setResponseType(type === "bot" ? "Bot" : "Manager");

        if (socketRef.current) {
          if (socketRef.current.connected) {
            socketRef.current.emit("join_chat", chatId);
            roomJoinedRef.current = true;
          } else {
            socketRef.current.once("connect", () => {
              socketRef.current.emit("join_chat", chatId);
              roomJoinedRef.current = true;
            });
          }
        } else {
          console.error("❌ socketRef.current is null!");
        }

        const parsedMessages = history.map((msg) => ({
          id: msg.ts,
          content: msg.message,
          type: msg.sender_id === businessId ? "sent" : "received",
          time: new Date(msg.ts).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }));

        setMessages(parsedMessages);
      } catch (err) {
        console.error("Error loading conversation:", err);
      }
    },
    [businessId]
  );

  const handleSendMessage = async () => {
    if (!message.trim() || !currentChatId || !selectedStudent) return;

    if (!roomJoinedRef.current && socketRef.current?.connected) {
      socketRef.current.emit("join_chat", currentChatId);
      roomJoinedRef.current = true;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const studentId = selectedStudent.clerkId || selectedStudent.id;
    const messageContent = message.trim();
    const tempId = Date.now();

    const newMessage = {
      id: tempId,
      content: messageContent,
      type: "sent",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessage("");

    socketRef.current.emit("send_message", {
      chatId: currentChatId,
      sender_id: businessId,
      receiver_id: studentId,
      message: messageContent,
      message_who: "receiver",
    });
  };

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const studentIdFromUrl = searchParams.get("studentId");
    if (studentIdFromUrl && !isLoading && allStudents.length > 0) {
      const student = allStudents.find((s) => s.clerkId === studentIdFromUrl);
      if (student) {
        handleSelectStudent(student);
        setSearchParams({});
      }
    }
  }, [
    isLoading,
    allStudents,
    searchParams,
    setSearchParams,
    handleSelectStudent,
  ]);

  const handleSelectDropdown = async (type) => {
    if (!currentChatId) return;

    const newType = type === "Bot" ? "bot" : "human";
    setResponseType(type);
    setShowMenu(false);

    try {
      await axios.put(
        `${import.meta.env.VITE_BE_URL}/api/conversation/${currentChatId}/type`,
        { type: newType }
      );
    } catch (err) {
      console.error("Error updating chat type:", err);
    }
  };

  const handleBotOptionClick = () => {
    if (hasBotAccess === "haveKnowledge") {
      handleSelectDropdown("Bot");
    } else {
      setShowMenu(false);
      navigate("/business-dashboard/my-ai");
    }
  };

  if (isLoading) {
    return (
      <div className="business-mess-placeholder-fullpage">
        <LoadingScreen />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="business-mess-placeholder-fullpage">
        <p>💬 Bạn chưa có cuộc trò chuyện nào.</p>
      </div>
    );
  }

  return (
    <>
      <NewChatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        studentList={allStudents}
        onSelectStudent={handleSelectStudent}
      />

      <div className="business-card business-mess-container">
        <div className="business-mess-sidebar">
          <div className="business-mess-sidebar-header">
            <h2 className="business-mess-sidebar-title">Tin nhắn</h2>
          </div>

          <div className="business-mess-chat-list">
            {conversations.map((convo) => (
              <div
                key={convo.chatId}
                className={`business-mess-chat-item ${
                  currentChatId === convo.chatId ? "active" : ""
                }`}
                onClick={() => handleSelectStudent(convo.student)}
              >
                <div className="business-mess-avatar-wrapper">
                  <img
                    src={convo.student?.imageUrl || "/default-avatar.png"}
                    alt="avatar"
                    className="business-mess-avatar"
                  />
                </div>
                <div className="business-mess-chat-info">
                  <p className="business-mess-chat-name">
                    {convo.student?.fullName || "Student User"}
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
                    src={selectedStudent?.imageUrl || "/default-avatar.png"}
                    alt="avatar"
                    className="business-mess-avatar"
                  />
                  <div>
                    <h4>{selectedStudent?.fullName || "Student User"}</h4>
                    <span>{selectedStudent?.email || ""}</span>
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
                        onClick={handleBotOptionClick}
                      >
                        Bot
                        {!hasBotAccess && (
                          <span className="upgrade-tooltip"> (Nâng cấp)</span>
                        )}
                        {hasBotAccess === "haveBot" && (
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
                  placeholder={`Nhắn bằng ${responseType}...`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  maxLength={250}
                  disabled={
                    responseType === "Bot" && hasBotAccess !== "haveKnowledge"
                  }
                />
                <button
                  className="business-mess-send-btn"
                  onClick={handleSendMessage}
                  disabled={!message.trim() || responseType === "Bot"}
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
