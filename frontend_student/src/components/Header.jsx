import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaUserCircle, FaHome, FaUserCog, FaBell } from 'react-icons/fa';
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react';
import { io } from 'socket.io-client';
import '../css/Header.css';
import AuthTokenReset from '../auth/AuthTokenReset';
import { useUserRole } from '../contexts/UserRoleContext';
import axios from 'axios';
import NotificationDropdown from './NotificationDropdown';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  const { role } = useUserRole();
  const { user } = useUser();

  const [isMenuOpen] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const [userCache, setUserCache] = useState({});
  const notificationRef = useRef(null);
  const socketRef = useRef(null);

  // Fetch unread notifications từ API
  const fetchUnreadNotifications = useCallback(async () => {
    if (!user?.id || role === 'admin') return;

    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BE_URL}/api/conversation/user/${
          user.id
        }/unread-notifications`
      );

      const { totalUnread, chats } = res.data;

      // Fetch thông tin business cho mỗi chat
      const notificationsWithUserInfo = await Promise.all(
        chats.slice(0, 5).map(async (chat) => {
          const businessOwnerId = chat.otherUserId;

          // Check cache
          if (userCache[businessOwnerId]) {
            return {
              id: chat.chatId,
              chatId: chat.chatId,
              sender_id: businessOwnerId,
              sender_name: userCache[businessOwnerId].name,
              sender_image: userCache[businessOwnerId].image,
              message: chat.lastMessage.message,
              timestamp: chat.lastMessage.ts,
              unreadCount: chat.unreadCount,
            };
          }

          // Fetch business info
          try {
            const businessRes = await axios.get(
              `${
                import.meta.env.VITE_BE_URL
              }/api/business/owner/${businessOwnerId}`
            );

            const businessData = businessRes.data?.[0];
            const businessName = businessData?.business_name || businessOwnerId;
            const businessImage = businessData?.business_image?.[0] || null;

            setUserCache((prev) => ({
              ...prev,
              [businessOwnerId]: { name: businessName, image: businessImage },
            }));

            return {
              id: chat.chatId,
              chatId: chat.chatId,
              sender_id: businessOwnerId,
              sender_name: businessName,
              sender_image: businessImage,
              message: chat.lastMessage.message,
              timestamp: chat.lastMessage.ts,
              unreadCount: chat.unreadCount,
            };
          } catch (err) {
            console.error('Error fetching business info:', err);
            return {
              id: chat.chatId,
              chatId: chat.chatId,
              sender_id: businessOwnerId,
              sender_name: businessOwnerId,
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
      console.error('Error fetching unread notifications:', err);
    }
  }, [user, role, userCache]);

  // Setup Socket.io listener - fetch notifications khi có tin nhắn mới
  useEffect(() => {
    if (!user?.id || role === 'admin') return;

    // Fetch lần đầu khi mount
    fetchUnreadNotifications();

    // Setup socket connection
    if (!socketRef.current) {
      socketRef.current = io(`${import.meta.env.VITE_BE_URL}`, {
        transports: ['websocket'],
      });

      socketRef.current.emit('join', user.id);

      // Lắng nghe tin nhắn mới từ BẤT KỲ chat nào
      socketRef.current.on('receive_message', (msg) => {
        // Chỉ fetch lại nếu tin nhắn KHÔNG phải của mình
        if (msg.sender_id !== user.id) {
          fetchUnreadNotifications();
        }
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off('receive_message');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user, role, fetchUnreadNotifications]);

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

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    const notiToOpen = notifications.find((noti) => noti.id === notificationId);
    if (!notiToOpen) {
      console.error('Không tìm thấy thông báo!');
      return;
    }

    const chatId = notiToOpen.chatId;
    const businessOwnerId = notiToOpen.sender_id;

    // Call API mark as read
    try {
      await axios.post(
        `${import.meta.env.VITE_BE_URL}/api/conversation/${chatId}/mark-read`,
        { userId: user.id }
      );

      // Refresh notifications sau khi mark as read
      fetchUnreadNotifications();
    } catch (err) {
      console.error('Error marking chat as read:', err);
    }

    setShowNotifications(false);

    // Navigate tới messages
    navigate(`dashboard/messages?ownerId=${businessOwnerId}`);
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
            `${import.meta.env.VITE_BE_URL}/api/conversation/${
              noti.chatId
            }/mark-read`,
            { userId: user.id }
          )
        )
      );

      // Refresh notifications sau khi clear all
      fetchUnreadNotifications();
    } catch (err) {
      console.error('Error clearing all notifications:', err);
    }
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
          isActive('/admin/users', true) ? 'active' : ''
        }`}
      >
        Người dùng
      </Link>
      <Link
        to="/admin/businesses"
        className={`header-nav-link ${
          isActive('/admin/businesses', true) ? 'active' : ''
        }`}
      >
        Doanh nghiệp
      </Link>
      <Link
        to="/admin/transactions"
        className={`header-nav-link ${
          isActive('/admin/transactions', true) ? 'active' : ''
        }`}
      >
        Giao dịch
      </Link>
      <Link
        to="/admin/feedback"
        className={`header-nav-link ${
          isActive('/admin/feedback', true) ? 'active' : ''
        }`}
      >
        Doanh nghiệp phản hồi
      </Link>
      <Link
        to="/admin/aibots"
        className={`header-nav-link ${
          isActive('/admin/aibots', true) ? 'active' : ''
        }`}
      >
        AI Bot
      </Link>
    </nav>
  );

  const renderUserMenu = () => (
    <nav className={`header-nav ${isMenuOpen ? 'active' : ''}`}>
      {role !== 'admin' && (
        <>
          <Link
            to="/"
            className={`header-nav-link ${isActive('/', true) ? 'active' : ''}`}
          >
            Trang chủ
          </Link>
          <Link
            to="/discover"
            className={`header-nav-link ${
              isActive('/discover') ? 'active' : ''
            }`}
          >
            Kết nối doanh nghiệp
          </Link>
          <Link
            to="/dashboard"
            className={`header-nav-link ${
              isActive('/dashboard') ? 'active' : ''
            }`}
          >
            Hỗ trợ học tập
          </Link>
        </>
      )}
    </nav>
  );

  const renderUserButtonMenu = () => {
    if (role === 'admin') {
      return (
        <UserButton.MenuItems>
          {isAdminPage ? (
            <UserButton.Action
              label="Trang chủ"
              labelIcon={<FaHome />}
              onClick={() => navigate('/')}
            />
          ) : (
            <UserButton.Action
              label="Quản trị hệ thống"
              labelIcon={<FaUserCog />}
              onClick={() => navigate('/admin/users')}
            />
          )}
        </UserButton.MenuItems>
      );
    }
    return null;
  };

  const renderMenu = () => {
    // Nếu là admin và đang ở homepage, không hiển thị menu
    if (role === 'admin' && !isAdminPage) {
      return null;
    }
    // Nếu là admin và đang ở admin page, hiển thị admin menu
    if (role === 'admin' && isAdminPage) {
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
              src="https://res.cloudinary.com/diqpghsfm/image/upload/v1762696181/2021-FPTU-Long_iiws6l.jpg"
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
            {role !== 'admin' && (
              <div className="notification-wrapper" ref={notificationRef}>
                <button
                  className="header-icon-btn"
                  onClick={toggleNotifications}
                  title="Thông báo tin nhắn"
                >
                  <FaBell size={20} />
                  {totalUnread > 0 && (
                    <span className="notification-badge">
                      {totalUnread > 99 ? '99+' : totalUnread}
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
