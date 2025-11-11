import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaUserCircle, FaBuilding, FaBell } from "react-icons/fa";
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/clerk-react";
import { io } from "socket.io-client";
import axios from "axios";
import "../css/Header.css";
import AuthTokenReset from "../auth/AuthTokenReset";
import { getCurrentUserId } from "../utils/useCurrentUserId";
import NotificationDropdown from "./NotificationDropdown";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();

  const [isMenuOpen,] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [hasBusiness, setHasBusiness] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userCache, setUserCache] = useState({});
  const notificationRef = useRef(null);
  const accountRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const socketRef = useRef(null);

  // Fetch unread notifications từ API (chỉ gọi khi cần)
  const fetchUnreadNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BE_URL}/api/conversation/user/${user.id}/unread-notifications`
      );

      const { totalUnread, chats } = res.data;

      // Fetch thông tin user cho mỗi chat
      const notificationsWithUserInfo = await Promise.all(
        chats.slice(0, 5).map(async (chat) => {
          const otherUserId = chat.otherUserId;

          // Check cache
          if (userCache[otherUserId]) {
            return {
              id: chat.chatId,
              chatId: chat.chatId,
              sender_id: otherUserId,
              sender_name: userCache[otherUserId].name,
              sender_image: userCache[otherUserId].image,
              message: chat.lastMessage.message,
              timestamp: chat.lastMessage.ts,
              unreadCount: chat.unreadCount,
            };
          }

          // Fetch user info
          try {
            const userRes = await axios.get(
              `${import.meta.env.VITE_BE_URL}/api/user/${otherUserId}`
            );

            const userName = userRes.data?.fullName || otherUserId;
            const userImage = userRes.data?.imageUrl || null;

            setUserCache((prev) => ({
              ...prev,
              [otherUserId]: { name: userName, image: userImage },
            }));

            return {
              id: chat.chatId,
              chatId: chat.chatId,
              sender_id: otherUserId,
              sender_name: userName,
              sender_image: userImage,
              message: chat.lastMessage.message,
              timestamp: chat.lastMessage.ts,
              unreadCount: chat.unreadCount,
            };
          } catch (err) {
            console.error("Error fetching user info:", err);
            return {
              id: chat.chatId,
              chatId: chat.chatId,
              sender_id: otherUserId,
              sender_name: otherUserId,
              sender_image: null,
              message: chat.lastMessage.message,
              timestamp: chat.lastMessage.ts,
              unreadCount: chat.unreadCount,
            };
          }
        })
      );

      setNotifications(notificationsWithUserInfo);
      setTotalUnread(totalUnread);
    } catch (err) {
      console.error("Error fetching unread notifications:", err);
    }
  }, [user, userCache]);

  // Setup Socket.io listener - fetch notifications khi có tin nhắn mới
  useEffect(() => {
    if (!user?.id) return;

    // Fetch lần đầu khi mount
    fetchUnreadNotifications();

    // Setup socket connection
    if (!socketRef.current) {
      socketRef.current = io(`${import.meta.env.VITE_BE_URL}`, {
        transports: ["websocket"],
      });

      socketRef.current.emit("join", user.id);

      // Lắng nghe tin nhắn mới từ BẤT KỲ chat nào
      socketRef.current.on("receive_message", (msg) => {
        // Chỉ fetch lại nếu tin nhắn KHÔNG phải của mình
        if (msg.sender_id !== user.id) {
          fetchUnreadNotifications();
        }
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off("receive_message");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user, fetchUnreadNotifications]);

  useEffect(() => {
    const fetchBusinessStatus = async () => {
      try {
        const ownerId = await getCurrentUserId();
        if (!ownerId) return;

        const response = await axios.get(
          `${import.meta.env.VITE_BE_URL}/api/business/owner/${ownerId}`
        );
        if (response.data && response.data.length > 0) {
          setHasBusiness(true);
        } else {
          setHasBusiness(false);
        }
      } catch (error) {
        console.error("Error fetching business data:", error);
        setHasBusiness(false);
      }
    };

    fetchBusinessStatus();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setShowAccountMenu(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    const notiToOpen = notifications.find((noti) => noti.id === notificationId);

    if (!notiToOpen) {
      console.error("Không tìm thấy thông báo!");
      return;
    }

    const chatId = notiToOpen.chatId;

    // Call API mark as read
    try {
      await axios.post(
        `${import.meta.env.VITE_BE_URL}/api/conversation/${chatId}/mark-read`,
        { userId: user.id }
      );

      // Refresh notifications sau khi mark as read
      fetchUnreadNotifications();
    } catch (err) {
      console.error("Error marking chat as read:", err);
    }

    setShowNotifications(false);

    // Navigate tới messages
    navigate(`/business-dashboard/messages`);
  };

  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev);
  };

  const handleClearAll = async () => {
    // Mark tất cả chats là đã đọc
    try {
      await Promise.all(
        notifications.map((noti) =>
          axios.post(
            `${import.meta.env.VITE_BE_URL}/api/conversation/${noti.chatId}/mark-read`,
            { userId: user.id }
          )
        )
      );

      // Refresh notifications sau khi clear all
      fetchUnreadNotifications();
    } catch (err) {
      console.error("Error clearing all notifications:", err);
    }
  };

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const renderUserMenu = () => (
    <nav className={`header-nav ${isMenuOpen ? "active" : ""}`}>
      <Link
        to="/"
        className={`header-nav-link ${isActive("/", true) ? "active" : ""}`}
      >
        Trang chủ
      </Link>

      <Link
        to="/discover"
        className={`header-nav-link ${isActive("/discover") ? "active" : ""}`}
      >
        Kết nối doanh nghiệp
      </Link>

      {hasBusiness ? (
        <Link
          to="/my-business"
          className={`header-nav-link ${isActive("/my-business", true) ? "active" : ""
            }`}
        >
          Doanh nghiệp của tôi
        </Link>
      ) : (
        <Link
          to="/business-registration"
          className={`header-nav-link ${isActive("/business-registration", true) ? "active" : ""
            }`}
        >
          Đăng ký doanh nghiệp
        </Link>
      )}

      <Link
        to="/business-dashboard"
        className={`header-nav-link ${isActive("/business-dashboard") ? "active" : ""
          }`}
      >
        Hỗ trợ doanh nghiệp
      </Link>
    </nav>
  );

  const renderUserButtonMenu = () => {
    return (
      <UserButton.MenuItems>
        {hasBusiness ? (
          <UserButton.Action
            label="Xem doanh nghiệp"
            labelIcon={<FaBuilding />}
            onClick={() => navigate("/my-business")}
          />
        ) : (
          <UserButton.Action
            label="Đăng ký doanh nghiệp"
            labelIcon={<FaBuilding />}
            onClick={() => navigate("/business-registration")}
          />
        )}
      </UserButton.MenuItems>
    );
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo */}
        <div className="header-left">
          <Link to="/">
            <img
              src="/Logo_FPT_Education.png"
              alt="FPT Education Logo"
              className="header-logo"
            />
          </Link>
        </div>

        {/* Menu điều hướng */}
        {renderUserMenu()}

        {/* Account menu */}
        <SignedOut>
          <AuthTokenReset />
          <div
            className="account-menu-wrapper"
            ref={accountRef}
            onClick={() => setShowAccountMenu((prev) => !prev)}
          >
            <FaUserCircle size={20} />
            <span>Tài khoản</span>
            {showAccountMenu && (
              <ul className="account-dropdown">
                <li>
                  <Link to="/login">Đăng nhập</Link>
                </li>
                <li>
                  <Link to="/signup">Đăng ký</Link>
                </li>
              </ul>
            )}
          </div>
        </SignedOut>

        <SignedIn>
          <div className="signed-in-controls">
            <div className="notification-wrapper" ref={notificationRef}>
              <button
                className="header-icon-btn"
                onClick={toggleNotifications}
                title="Thông báo tin nhắn"
              >
                <FaBell size={20} />
                {totalUnread > 0 && (
                  <span className="notification-badge">
                    {totalUnread > 99 ? "99+" : totalUnread}
                  </span>
                )}
              </button>

              <NotificationDropdown
                isOpen={showNotifications}
                notifications={notifications}
                totalUnread={totalUnread}
                onMarkAsRead={handleMarkAsRead}
                onClearAll={handleClearAll}
              />
            </div>

            <div className="header-user-info">
              <UserButton userProfileUrl="/user-profile" appearance={{}}>
                {renderUserButtonMenu()}
              </UserButton>
            </div>
          </div>
        </SignedIn>
      </div>
    </header>
  );
};

export default Header;
