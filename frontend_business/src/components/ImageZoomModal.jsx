import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import '../css/ImageZoomModal.css';

const ImageZoomModal = ({ isOpen, imageUrl, onClose, imageAlt = "Phóng to ảnh" }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setImageLoaded(false);
    } else {
      document.body.style.overflow = '';
      setImageLoaded(false);
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('image-zoom-backdrop')) {
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const modalRoot = document.getElementById('modal-root') || document.body;

  return ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="image-zoom-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={handleBackdropClick}
        >
          <motion.div
            className="image-zoom-content"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <div className="image-zoom-container">
              {!imageLoaded && (
                <div className="image-loading">
                  <div className="loading-spinner"></div>
                  <p>Đang tải ảnh...</p>
                </div>
              )}
              <img
                src={imageUrl}
                alt={imageAlt}
                className={`zoomed-image ${imageLoaded ? 'loaded' : ''}`}
                onLoad={handleImageLoad}
                onError={(e) => { 
                  e.target.src = '/1.png'; 
                  setImageLoaded(true);
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    modalRoot
  );
};

export default ImageZoomModal; 