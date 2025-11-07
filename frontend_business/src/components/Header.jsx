import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaUserCircle, FaBuilding, FaBell } from "react-icons/fa";
import { IoNotificationsOutline } from "react-icons/io5";
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/clerk-react";
import { io } from "socket.io-client";
import axios from "axios";
import "../css/Header.css";
import AuthTokenReset from "../auth/AuthTokenReset";
import { getCurrentUserId } from "../utils/useCurrentUserId";
import NotificationDropdown from "./NotificationDropdown";

const NOTI_STORAGE_KEY = "allNotifications";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const socketRef = useRef(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [hasBusiness, setHasBusiness] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [userCache, setUserCache] = useState({});
  const notificationRef = useRef(null);
  const accountRef = useRef(null);

  const [notifications, setNotifications] = useState(() => {
    const storedNotis = localStorage.getItem(NOTI_STORAGE_KEY);
    return storedNotis ? JSON.parse(storedNotis) : [];
  });

  useEffect(() => {
    const latestNotis = notifications.slice(0, 15);
    localStorage.setItem(NOTI_STORAGE_KEY, JSON.stringify(latestNotis));

    const hasUnread = latestNotis.some((noti) => !noti.is_read);
    setHasNewNotifications(hasUnread);
  }, [notifications]);

  useEffect(() => {
    if (!user) {
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
        let senderName = "Người gửi";
        let senderImage = null;

        if (notifications.find((n) => n.id === noti.id)) {
          return;
        }

        if (userCache[noti.sender_id]) {
          senderName = userCache[noti.sender_id].name;
          senderImage = userCache[noti.sender_id].image;
        } else {
          try {
            const res = await axios.get(
              `${import.meta.env.VITE_BE_URL}/api/user/${noti.sender_id}`
            );
            if (res.data) {
              senderName = res.data.fullName || noti.sender_id;
              senderImage = res.data.imageUrl || null;
              setUserCache((prevCache) => ({
                ...prevCache,
                [noti.sender_id]: { name: senderName, image: senderImage },
              }));
            }
          } catch (err) {
            console.error("Lỗi khi fetch tên user:", err);
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
  }, [user, userCache]);

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

  const handleMarkAsRead = (notificationId) => {
    const notiToOpen = notifications.find((noti) => noti.id === notificationId);

    if (!notiToOpen) {
      console.error("Không tìm thấy thông báo!");
      return;
    }

    const studentId = notiToOpen.sender_id;

    setNotifications((prevNotis) =>
      prevNotis.filter((noti) => noti.id !== notificationId)
    );

    setShowNotifications(false);

    navigate(`/business-dashboard/messages?studentId=${studentId}`);
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
          className={`header-nav-link ${
            isActive("/my-business", true) ? "active" : ""
          }`}
        >
          Doanh nghiệp của tôi
        </Link>
      ) : (
        <Link
          to="/business-registration"
          className={`header-nav-link ${
            isActive("/business-registration", true) ? "active" : ""
          }`}
        >
          Đăng ký doanh nghiệp
        </Link>
      )}

      <Link
        to="/business-dashboard"
        className={`header-nav-link ${
          isActive("/business-dashboard") ? "active" : ""
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
