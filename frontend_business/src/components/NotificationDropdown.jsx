import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const NotificationDropdown = ({ isOpen }) => {
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
          <p>Chưa có thông báo</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationDropdown;
