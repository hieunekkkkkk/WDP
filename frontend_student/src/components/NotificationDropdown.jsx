import { motion, AnimatePresence } from "framer-motion";
import { CiTrash } from "react-icons/ci";

const NotificationDropdown = ({
  isOpen,
  notifications = [],
  onMarkAsRead,
  totalUnread = 0,
  onClearAll,
}) => {
  const unreadVisibleCount = notifications.filter((n) => !n.is_read).length;

  const overflowCount = totalUnread - unreadVisibleCount;
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
            <h4>Thông báo tin nhắn</h4>
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
              <p className="notification-item-empty">Chưa có thông báo</p>
            ) : (
              notifications.map((noti) => (
                <div
                  key={noti.id}
                  className={`notification-item ${
                    !noti.is_read ? "unread" : ""
                  }`}
                  onClick={() => onMarkAsRead(noti.id)}
                >
                  <img
                    src={noti.sender_image || "/default-avatar.png"}
                    alt="avatar"
                    className="notification-avatar"
                  />
                  <p>
                    <strong>{noti.sender_name || noti.sender_id}</strong>:{" "}
                    {noti.message}
                  </p>
                </div>
              ))
            )}
          </div>
          {overflowCount > 0 && (
            <div className="notification-footer">
              <p>
                {overflowCount >= 9 ? "9+" : "+ " + overflowCount} thông báo mới
                khác
              </p>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationDropdown;
