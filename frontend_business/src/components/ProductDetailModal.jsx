import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import ProductFeedback from './ProductFeedback';
import ImageZoomModal from './ImageZoomModal';
import '../css/ProductDetailModal.css';

const ProductDetailModal = ({
  showModal,
  setShowModal,
  selectedProduct,
  setSelectedProduct,
  businessId,
  renderStars,
}) => {
  const [selectedImage, setSelectedImage] = useState(0);
  
  // Image zoom state
  const [isImageZoomOpen, setIsImageZoomOpen] = useState(false);
  const [zoomedImageUrl, setZoomedImageUrl] = useState('');

  const closeModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
  };

  // Handle image zoom
  const handleImageZoom = (imageUrl) => {
    setZoomedImageUrl(imageUrl);
    setIsImageZoomOpen(true);
  };

  const closeImageZoom = () => {
    setIsImageZoomOpen(false);
    setZoomedImageUrl('');
  };

  useEffect(() => {
    if (showModal) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => (document.body.style.overflow = '');
  }, [showModal]);

  const modalRoot = document.getElementById('modal-root') || document.body;

  return ReactDOM.createPortal(
    <AnimatePresence>
      {showModal && selectedProduct && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={closeModal}
        >
          <motion.div
            className="modal-content"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-product-exit"
              onClick={closeModal}
              aria-label="Close modal"
            >
              ✕
            </button>

            <h1 className="modal-product-header">Chi tiết sản phẩm</h1>

            <div className="business-content">
              <div className="business-images">
                <div className="main-image">
                  <img
                    src={selectedProduct.thumbnails[selectedImage]}
                    alt={`${selectedProduct.name} main ${selectedImage + 1}`}
                    className="main-img"
                    style={{ cursor: 'zoom-in' }}
                    onClick={() => handleImageZoom(selectedProduct.thumbnails[selectedImage])}
                    onError={(e) => { e.target.src = '/1.png'; }}
                  />
                </div>
                <div className="thumbnail-images">
                  {selectedProduct.thumbnails.map((thumb, idx) => (
                    <div
                      key={idx}
                      className={`thumbnail ${selectedImage === idx ? 'active' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedImage(idx);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <img
                        src={thumb}
                        alt={`${selectedProduct.name} thumbnail ${idx + 1}`}
                        onError={(e) => { e.target.src = '/1.png'; }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="business-info">
                <h1 className="modal-product-title">{selectedProduct.name}</h1>
                <div className="business-status">
                  <span className="modal-product-price">{selectedProduct.price} VND</span>
                </div>
                <p className="business-category">Đánh giá bởi người dùng</p>
                <div className="rating-section">
                  <div className="stars">{renderStars(selectedProduct.rating)}</div>
                  <span className="rating-count">{selectedProduct.reviews}</span>
                </div>
                <p className="business-description">{selectedProduct.description}</p>
              </div>
            </div>

            {/* Product Feedback Section */}
            <ProductFeedback
              productId={selectedProduct.id}
              businessId={businessId}
            />
          </motion.div>
        </motion.div>
      )}

      {/* Image Zoom Modal */}
      <ImageZoomModal
        isOpen={isImageZoomOpen}
        imageUrl={zoomedImageUrl}
        onClose={closeImageZoom}
        imageAlt="Phóng to ảnh sản phẩm"
      />
    </AnimatePresence>,
    modalRoot
  );
};

export default ProductDetailModal;
