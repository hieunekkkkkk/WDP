import { AnimatePresence, motion } from "framer-motion";
import { CiTrash } from "react-icons/ci";

/**
 * NotificationDropdown Component
 * 
 * Hiển thị thông báo tin nhắn real-time từ Socket.io
 * - Hiển thị 5 thông báo gần nhất
 * - Badge cho tin chưa đọc
 * - Click để đánh dấu đã đọc và chuyển tới chat
 * - Xóa tất cả thông báo
 */
const NotificationDropdown = ({
  isOpen,
  notifications = [],
  onMarkAsRead,
  totalUnread = 0,
  onClearAll,
}) => {
  // Tất cả notifications đều là unread (API chỉ trả về unread)
  const unreadVisibleCount = notifications.length;
  const overflowCount = totalUnread - unreadVisibleCount;

  // Format thời gian hiển thị
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return time.toLocaleDateString("vi-VN");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="notification-dropdown"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <div className="notification-header">
            <h4>
              Thông báo tin nhắn
              {totalUnread > 0 && (
                <span className="notification-count-badge">{totalUnread}</span>
              )}
            </h4>
            {notifications.length > 0 && (
              <CiTrash
                className="notification-clear-btn"
                onClick={onClearAll}
                title="Xóa tất cả thông báo"
                size={24}
              />
            )}
          </div>
          <div className="notification-list">
            {notifications.length === 0 ? (
              <p className="notification-item-empty">Không có tin nhắn chưa đọc</p>
            ) : (
              notifications.map((noti) => (
                <div
                  key={noti.id}
                  className="notification-item unread"
                  onClick={() => onMarkAsRead(noti.id)}
                >
                  <img
                    src={noti.sender_image || "/default-avatar.png"}
                    alt="avatar"
                    className="notification-avatar"
                  />
                  <div className="notification-content">
                    <div className="notification-sender">
                      <strong>{noti.sender_name || noti.sender_id}</strong>
                      <span className="unread-count-badge">
                        {noti.unreadCount > 99 ? "99+" : noti.unreadCount}
                      </span>
                    </div>
                    <p className="notification-message">{noti.message}</p>
                    <span className="notification-time">
                      {formatTime(noti.timestamp)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          {overflowCount > 0 && (
            <div className="notification-footer">
              <p>
                + {overflowCount > 99 ? "99+" : overflowCount} tin nhắn chưa đọc khác
              </p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationDropdown;
