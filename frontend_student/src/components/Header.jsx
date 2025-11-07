import React, { useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaUserCircle, FaHome, FaUserCog, FaBell } from "react-icons/fa";
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/clerk-react";
import "../css/Header.css";
import AuthTokenReset from "../auth/AuthTokenReset";
import { useUserRole } from "../contexts/UserRoleContext";
import { io } from "socket.io-client";
import axios from "axios";
import NotificationDropdown from "./NotificationDropdown";
import { useEffect } from "react";

const NOTI_STORAGE_KEY = "allNotifications";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin");
  const { role } = useUserRole();
  const { user } = useUser();
  const socketRef = useRef(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountRef = useRef(null);

  const [notifications, setNotifications] = useState(() => {
    const storedNotis = localStorage.getItem(NOTI_STORAGE_KEY);
    return storedNotis ? JSON.parse(storedNotis) : [];
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [userCache, setUserCache] = useState({});
  const notificationRef = useRef(null);

  useEffect(() => {
    const latestNotis = notifications.slice(0, 15); // Giữ 15 noti mới nhất
    localStorage.setItem(NOTI_STORAGE_KEY, JSON.stringify(latestNotis));

    const hasUnread = latestNotis.some((noti) => !noti.is_read);
    setHasNewNotifications(hasUnread);
  }, [notifications]); // 11. Thêm Effect để quản lý Socket.io

  useEffect(() => {
    if (!user || role === "admin") {
      // Admin không cần nhận noti tin nhắn
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    if (user && !socketRef.current) {
      const userId = user.id;
      socketRef.current = io(`${import.meta.env.VITE_BE_URL}`, {
        transports: ["websocket"],
      });

      socketRef.current.emit("join", userId);

      const onNewNotification = async (noti) => {
        // (Logic fetch tên user và cache, giống hệt file Business)
        if (notifications.find((n) => n.id === noti.id)) return;

        let senderName = "Người gửi";
        let senderImage = null;
        if (userCache[noti.sender_id]) {
          senderName = userCache[noti.sender_id].name;
          senderImage = userCache[noti.sender_id].image;
        } else {
          try {
            const res = await axios.get(
              `${import.meta.env.VITE_BE_URL}/api/business/owner/${
                noti.sender_id
              }`
            );

            if (res.data && res.data.length > 0) {
              const businessInfo = res.data[0];

              senderName = businessInfo.business_name || noti.sender_id;
              senderImage = businessInfo.business_image?.[0] || null;

              setUserCache((prevCache) => ({
                ...prevCache,
                [noti.sender_id]: { name: senderName, image: senderImage },
              }));
            } else {
              senderName = noti.sender_id;
            }
          } catch (err) {
            console.error("Lỗi khi fetch thông tin business:", err);
            senderName = noti.sender_id;
          }
        }

        setNotifications((prev) => [
          {
            ...noti,
            sender_name: senderName,
            sender_image: senderImage,
            is_read: false,
          },
          ...prev,
        ]);
        setHasNewNotifications(true);
      };

      socketRef.current.on("new_notification", onNewNotification);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user, role, userCache]); // Thêm 'role' // 12. Thêm Effect để xử lý click bên ngoài (cho cả 2 dropdown)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setShowAccountMenu(false);
      } // Thêm logic cho notificationRef
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

  const handleMarkAsRead = (notificationId) => {
    const notiToOpen = notifications.find((noti) => noti.id === notificationId);
    if (!notiToOpen) return;

    const businessOwnerId = notiToOpen.sender_id;

    setNotifications((prevNotis) =>
      prevNotis.filter((noti) => noti.id !== notificationId)
    );
    setShowNotifications(false); // Điều hướng đến trang tin nhắn của Student

    navigate(`dashboard/messages?ownerId=${businessOwnerId}`);
  };

  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev);
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const renderAdminMenu = () => (
    <nav className="header-nav">
      <Link
        to="/admin/users"
        className={`header-nav-link ${
          isActive("/admin/users", true) ? "active" : ""
        }`}
      >
        Người dùng
      </Link>
      <Link
        to="/admin/businesses"
        className={`header-nav-link ${
          isActive("/admin/businesses", true) ? "active" : ""
        }`}
      >
        Doanh nghiệp
      </Link>
      <Link
        to="/admin/transactions"
        className={`header-nav-link ${
          isActive("/admin/transactions", true) ? "active" : ""
        }`}
      >
        Giao dịch
      </Link>
      <Link
        to="/admin/feedback"
        className={`header-nav-link ${
          isActive("/admin/feedback", true) ? "active" : ""
        }`}
      >
        Doanh nghiệp phản hồi
      </Link>
      <Link
        to="/admin/aibots"
        className={`header-nav-link ${
          isActive("/admin/aibots", true) ? "active" : ""
        }`}
      >
        AI Bot
      </Link>
    </nav>
  );

  const renderUserMenu = () => (
    <nav className={`header-nav ${isMenuOpen ? "active" : ""}`}>
      {role !== "admin" && (
        <>
          <Link
            to="/"
            className={`header-nav-link ${isActive("/", true) ? "active" : ""}`}
          >
            Trang chủ
          </Link>
          <Link
            to="/discover"
            className={`header-nav-link ${
              isActive("/discover") ? "active" : ""
            }`}
          >
            Kết nối doanh nghiệp
          </Link>
          <Link
            to="/dashboard"
            className={`header-nav-link ${
              isActive("/dashboard") ? "active" : ""
            }`}
          >
            Hỗ trợ học tập
          </Link>
        </>
      )}
    </nav>
  );

  const renderUserButtonMenu = () => {
    if (role === "admin") {
      return (
        <UserButton.MenuItems>
          {isAdminPage ? (
            <UserButton.Action
              label="Trang chủ"
              labelIcon={<FaHome />}
              onClick={() => navigate("/")}
            />
          ) : (
            <UserButton.Action
              label="Quản trị hệ thống"
              labelIcon={<FaUserCog />}
              onClick={() => navigate("/admin/users")}
            />
          )}
        </UserButton.MenuItems>
      );
    }
    return null;
  };

  const renderMenu = () => {
    // Nếu là admin và đang ở homepage, không hiển thị menu
    if (role === "admin" && !isAdminPage) {
      return null;
    }
    // Nếu là admin và đang ở admin page, hiển thị admin menu
    if (role === "admin" && isAdminPage) {
      return renderAdminMenu();
    }
    // Các trường hợp khác hiển thị user menu
    return renderUserMenu();
  };

  return (
    <header className="header">
      <div className="main-header-container">
        <div className="header-left">
          <Link to="/">
            <img
              src="/Logo_FPT_Education.png"
              alt="FPT Education Logo"
              className="header-logo"
            />
          </Link>
        </div>

        {renderMenu()}

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
          <div className="header-user-info">
            {role !== "admin" && (
              <div className="notification-wrapper" ref={notificationRef}>
                <button
                  className="header-icon-btn"
                  onClick={toggleNotifications}
                  title="Thông báo"
                >
                  <FaBell size={20} />
                  {hasNewNotifications && (
                    <span className="notification-badge"></span>
                  )}
                </button>
                <NotificationDropdown
                  isOpen={showNotifications}
                  notifications={notifications.slice(0, 5)}
                  totalUnread={notifications.filter((n) => !n.is_read).length}
                  onMarkAsRead={handleMarkAsRead}
                  onClearAll={handleClearAll}
                />
              </div>
            )}
            <UserButton userProfileUrl="/user-profile">
              {renderUserButtonMenu()}
            </UserButton>
          </div>
        </SignedIn>
      </div>
    </header>
  );
};

export default Header;
