import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { convertFilesToBase64 } from '../utils/imageToBase64';
import '../css/ProductDetailModal.css';
import MyBusinessProductFeedback from './MyBusinessProductFeedback';
import { LuTextCursorInput } from 'react-icons/lu';
import { toast } from 'react-toastify';
import axios from 'axios';
import { RxCross2 } from 'react-icons/rx';

const formatPrice = (price) => {
  if (!price) return 'Chưa cập nhật';
  const numPrice = parseInt(String(price).replace(/[^0-9]/g, ''), 10);
  if (isNaN(numPrice)) return price;
  return numPrice.toLocaleString('vi-VN');
};

const BusinessProductModal = ({
  showModal,
  setShowModal,
  selectedProduct,
  setSelectedProduct,
  products,
  setProducts,
  renderStars,
  enableEdit = true,
  businessId,
}) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [editFields, setEditFields] = useState({});
  const [editedValues, setEditedValues] = useState({});
  const [newImages, setNewImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [imageIndexToDelete, setImageIndexToDelete] = useState(null);

  // Field mapping to align frontend and backend field names
  const fieldMapping = {
    name: 'product_name',
    price: 'product_price',
    description: 'product_description',
    thumbnails: 'product_image',
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
    setEditFields({});
    setEditedValues({});
    setNewImages([]);
    setError(null);
  };

  useEffect(() => {
    if (showModal) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => (document.body.style.overflow = '');
  }, [showModal]);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      if (!selectedProduct?.id) return;

      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BE_URL}/api/feedback/product/${
            selectedProduct.id
          }`
        );

        if (res.data?.success && Array.isArray(res.data.data)) {
          const data = res.data.data;
          setFeedbacks(data);

          const total = data.reduce(
            (sum, f) => sum + (f.feedback_rating || 0),
            0
          );
          const avg = data.length > 0 ? total / data.length : 0;
          setAverageRating(avg);
        } else {
          setFeedbacks([]);
          setAverageRating(0);
        }
      } catch (err) {
        console.error('Error fetching feedbacks:', err);
      }
    };

    fetchFeedbacks();
  }, [selectedProduct]);

  useEffect(() => {
    const relevantFeedbacks = showActiveOnly
      ? feedbacks.filter((f) => f.feedback_status === 'active')
      : feedbacks;

    const total = relevantFeedbacks.reduce(
      (sum, f) => sum + (f.feedback_rating || 0),
      0
    );
    const avg =
      relevantFeedbacks.length > 0 ? total / relevantFeedbacks.length : 0;
    setAverageRating(avg);
  }, [showActiveOnly, feedbacks]);

  const handleEdit = (field) => {
    setEditFields((prev) => ({ ...prev, [field]: true }));
    setEditedValues((prev) => ({
      ...prev,
      [field]:
        field === 'price'
          ? parseFloat(selectedProduct[field]).toString()
          : selectedProduct[field] || '',
    }));
  };

  const handleChange = (e, field) => {
    let value = e.target.value;
    if (field === 'price') {
      value = value.replace(/[^0-9]/g, '');
    }
    setEditedValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleKeyDown = (e, field) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBlur(field);
    }
  };

  const handleBlur = async (field) => {
    const newValue = editedValues[field];
    const oldValue = selectedProduct[field];

    if (field === 'name') {
      if (!newValue || !newValue.trim()) {
        toast.error('Tên sản phẩm không được để trống.');
        setEditedValues((prev) => ({ ...prev, [field]: oldValue }));
        setEditFields((prev) => ({ ...prev, [field]: false }));
        return;
      }
      if (newValue.trim().length > 100) {
        toast.error('Tên sản phẩm không được vượt quá 100 ký tự.');
        setEditedValues((prev) => ({ ...prev, [field]: oldValue }));
        setEditFields((prev) => ({ ...prev, [field]: false }));
        return;
      }
    }

    if (field === 'description') {
      if (newValue.trim().length > 1000) {
        toast.error('Mô tả sản phẩm không được vượt quá 1000 ký tự.');
        setEditedValues((prev) => ({ ...prev, [field]: oldValue }));
        setEditFields((prev) => ({ ...prev, [field]: false }));
        return;
      }
    }

    if (field === 'price') {
      const numericPrice = parseFloat(newValue);
      if (isNaN(numericPrice) || numericPrice < 1000) {
        toast.error('Giá thành phải là một số và ít nhất là 1,000.');
        setEditedValues((prev) => ({ ...prev, [field]: oldValue }));
        setEditFields((prev) => ({ ...prev, [field]: false }));
        return;
      }
    }
    if (newValue !== oldValue) {
      setLoading(true);
      try {
        const apiField = fieldMapping[field] || field;
        let value = editedValues[field];
        if (field === 'price') {
          value = parseFloat(value) || 0;
        }
        const response = await fetch(
          `${import.meta.env.VITE_BE_URL}/api/product/${selectedProduct.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [apiField]: value }),
          }
        );
        if (!response.ok) throw new Error('Cập nhật thất bại');
        const updatedProduct = await response.json();

        setSelectedProduct((prev) => ({
          ...prev,
          [field]: field === 'price' ? value.toString() : value,
        }));

        if (products && setProducts) {
          setProducts(
            products.map((p) =>
              p._id === selectedProduct.id ? { ...p, [apiField]: value } : p
            )
          );
        }
      } catch (err) {
        console.error(`Error updating ${field}:`, err);
        setError(`Không thể cập nhật ${field}. Chi tiết: ${err.message}`);
      } finally {
        setLoading(false);
        setEditFields((prev) => ({ ...prev, [field]: false }));
      }
    } else {
      setEditFields((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handleAddImage = async (event) => {
    const files = Array.from(event.target.files);

    if (files.length === 0) return;

    const toastId = toast.loading('Đang xử lý ảnh...');

    try {
      const base64Images = await convertFilesToBase64(files);
      setNewImages((prevImages) => [...prevImages, ...base64Images]);
      setError(null);
      toast.update(toastId, {
        render: "Ảnh đã sẵn sàng! Nhấn 'Lưu ảnh' để xác nhận.",
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error('Error converting images to base64:', error);
      setError('Không thể chuyển đổi ảnh. Vui lòng thử lại.');
      toast.update(toastId, {
        render: 'Không thể xử lý ảnh. Vui lòng thử lại.',
        type: 'error',
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSaveImages = async () => {
    if (newImages.length > 0 && selectedProduct) {
      setLoading(true);
      const toastId = toast.loading('Đang lưu ảnh...');

      try {
        const updatedThumbnails = [
          ...(selectedProduct.thumbnails || []),
          ...newImages,
        ];

        const response = await fetch(
          `${import.meta.env.VITE_BE_URL}/api/product/${selectedProduct.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_image: updatedThumbnails }),
          }
        );

        if (!response.ok) throw new Error('Cập nhật ảnh thất bại');

        setSelectedProduct((prev) => ({
          ...prev,
          thumbnails: updatedThumbnails,
        }));

        if (products && setProducts) {
          setProducts((prev) =>
            prev.map((p) =>
              p._id === selectedProduct.id
                ? { ...p, product_image: updatedThumbnails }
                : p
            )
          );
        }

        setNewImages([]);
        setError(null);
        toast.update(toastId, {
          render: 'Lưu ảnh thành công!',
          type: 'success',
          isLoading: false,
          autoClose: 3000,
        });
      } catch (err) {
        console.error('Error saving images:', err);
        setError(
          'Không thể lưu ảnh. Vui lòng kiểm tra kết nối hoặc liên hệ admin.'
        );
        toast.update(toastId, {
          render: 'Không thể lưu ảnh. Vui lòng thử lại.',
          type: 'error',
          isLoading: false,
          autoClose: 5000,
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteImage = (index) => {
    if (allThumbnails.length === 1) {
      toast.warning('Sản phẩm phải có ít nhất một ảnh.');
      return;
    }

    setImageIndexToDelete(index);
    setIsDeleteModalOpen(true);
  };

  const executeDeleteImage = async () => {
    if (imageIndexToDelete === null) return;
    const index = imageIndexToDelete;

    setIsDeleteModalOpen(false);
    setLoading(true);
    const toastId = toast.loading('Đang xóa ảnh...');

    try {
      const updatedThumbnails = allThumbnails.filter((_, i) => i !== index);

      const response = await fetch(
        `${import.meta.env.VITE_BE_URL}/api/product/${selectedProduct.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_image: updatedThumbnails }),
        }
      );

      if (!response.ok) throw new Error('Failed to delete image');

      const updatedNewImages = newImages.filter((img) =>
        updatedThumbnails.includes(img)
      );

      const updatedProductThumbnails = updatedThumbnails.filter(
        (img) => !newImages.includes(img) || updatedNewImages.includes(img)
      );

      const newSelectedImage =
        index === selectedImage
          ? 0
          : index < selectedImage
          ? Math.max(0, selectedImage - 1)
          : selectedImage;

      setSelectedProduct((prev) => ({
        ...prev,
        thumbnails: updatedProductThumbnails,
      }));
      setNewImages(updatedNewImages);
      setSelectedImage(newSelectedImage);

      if (products && setProducts) {
        setProducts((prev) =>
          prev.map((p) =>
            p._id === selectedProduct.id
              ? { ...p, product_image: updatedThumbnails }
              : p
          )
        );
      }

      setError(null);
      toast.update(toastId, {
        render: 'Xóa ảnh thành công!',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
    } catch (err) {
      console.error('Error deleting image:', err);
      setError('Không thể xóa ảnh. Vui lòng thử lại.');
      toast.update(toastId, {
        render: 'Không thể xóa ảnh. Vui lòng thử lại.',
        type: 'error',
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
      setImageIndexToDelete(null);
    }
  };

  const allThumbnails = [
    ...(selectedProduct?.thumbnails || []),
    ...(newImages || []),
  ];
  const modalRoot = document.getElementById('modal-root') || document.body;

  return ReactDOM.createPortal(
    <>
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
              className="product-modal-content"
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
                      src={allThumbnails[selectedImage] || '1.png'}
                      alt={`${selectedProduct.name} main ${selectedImage + 1}`}
                      className="main-img"
                      onError={(e) => (e.target.src = '1.png')}
                    />
                  </div>
                  <div className="thumbnail-images">
                    {allThumbnails.length > 0 ? (
                      allThumbnails.map((thumb, idx) => (
                        <div
                          key={idx}
                          className={`thumbnail ${
                            selectedImage === idx ? 'active' : ''
                          }`}
                          style={{ position: 'relative', cursor: 'pointer' }}
                          onClick={() => setSelectedImage(idx)}
                        >
                          <img
                            src={thumb || '1.png'}
                            alt={`${selectedProduct.name} thumbnail ${idx + 1}`}
                            onError={(e) => (e.target.src = '1.png')}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                          {enableEdit && (
                            <button
                              className="remove-image-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteImage(idx);
                              }}
                              aria-label={`Delete image ${idx + 1}`}
                            >
                              <RxCross2 />
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <p>Không có ảnh nào để hiển thị.</p>
                    )}
                    {enableEdit && (
                      <>
                        <label className="thumbnail add-image">
                          <FaPlus />
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            ref={fileInputRef}
                            onChange={handleAddImage}
                            style={{ display: 'none' }}
                          />
                        </label>
                        {newImages.length > 0 && (
                          <button
                            className="business-modal-save-image"
                            onClick={handleSaveImages}
                            style={{
                              padding: '0.5rem 1rem',
                              background: '#4CAF50',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              marginTop: '0',
                              cursor: loading ? 'not-allowed' : 'pointer',
                            }}
                            disabled={loading}
                          >
                            {loading ? 'Đang lưu...' : 'Lưu ảnh'}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="business-info">
                  <div
                    className="editable-field"
                    onMouseEnter={() =>
                      enableEdit &&
                      !editFields['name'] &&
                      setEditFields((prev) => ({ ...prev, hoverName: true }))
                    }
                    onMouseLeave={() =>
                      enableEdit &&
                      !editFields['name'] &&
                      setEditFields((prev) => ({ ...prev, hoverName: false }))
                    }
                  >
                    <h1 className="modal-product-title">
                      {editFields['name'] ? (
                        <input
                          type="text"
                          value={editedValues['name'] || ''}
                          onChange={(e) => handleChange(e, 'name')}
                          onBlur={() => handleBlur('name')}
                          onKeyDown={(e) => handleKeyDown(e, 'name')}
                          autoFocus
                          disabled={loading}
                          maxLength="100"
                        />
                      ) : (
                        selectedProduct.name
                      )}
                    </h1>
                    {enableEdit &&
                      !editFields['name'] &&
                      editFields.hoverName && (
                        <p
                          className="edit-btn"
                          onClick={() => handleEdit('name')}
                        >
                          <LuTextCursorInput />
                        </p>
                      )}
                  </div>
                  <div
                    className="editable-field"
                    onMouseEnter={() =>
                      enableEdit &&
                      !editFields['price'] &&
                      setEditFields((prev) => ({ ...prev, hoverPrice: true }))
                    }
                    onMouseLeave={() =>
                      enableEdit &&
                      !editFields['price'] &&
                      setEditFields((prev) => ({ ...prev, hoverPrice: false }))
                    }
                  >
                    <div className="business-status">
                      <span className="modal-product-price">
                        {editFields['price'] ? (
                          <input
                            type="text"
                            value={editedValues['price'] || ''}
                            onChange={(e) => handleChange(e, 'price')}
                            onBlur={() => handleBlur('price')}
                            onKeyDown={(e) => handleKeyDown(e, 'price')}
                            autoFocus
                            disabled={loading}
                            placeholder="Enter price (e.g., 1500000)"
                          />
                        ) : (
                          `${formatPrice(selectedProduct.price)} ₫`
                        )}
                      </span>
                    </div>
                    {enableEdit &&
                      !editFields['price'] &&
                      editFields.hoverPrice && (
                        <p
                          className="edit-btn"
                          onClick={() => handleEdit('price')}
                        >
                          <LuTextCursorInput />
                        </p>
                      )}
                  </div>
                  <p className="business-category">Đánh giá bởi người dùng</p>
                  <div className="rating-section">
                    <div className="stars">{renderStars(averageRating)}</div>
                    <div className="rating-count-toggle">
                      <span className="rating-count">
                        {showActiveOnly
                          ? feedbacks.filter(
                              (f) => f.feedback_status === 'active'
                            ).length
                          : feedbacks.length}{' '}
                        đánh giá
                      </span>
                      <label
                        className="toggle-container"
                        style={{ marginLeft: '0.5rem' }}
                      >
                        <input
                          type="checkbox"
                          checked={showActiveOnly}
                          onChange={() => setShowActiveOnly((prev) => !prev)}
                          className="toggle-input"
                        />
                        <span className="toggle-slider"></span>
                        <span className="status-text">
                          {showActiveOnly ? 'Chỉ active' : 'Tất cả'}
                        </span>
                      </label>
                    </div>
                  </div>
                  <div
                    className="editable-field"
                    onMouseEnter={() =>
                      enableEdit &&
                      !editFields['description'] &&
                      setEditFields((prev) => ({
                        ...prev,
                        hoverDescription: true,
                      }))
                    }
                    onMouseLeave={() =>
                      enableEdit &&
                      !editFields['description'] &&
                      setEditFields((prev) => ({
                        ...prev,
                        hoverDescription: false,
                      }))
                    }
                  >
                    <p
                      className="business-description"
                      style={{ width: '100%' }}
                    >
                      {editFields['description'] ? (
                        <textarea
                          value={editedValues['description'] || ''}
                          onChange={(e) => handleChange(e, 'description')}
                          onBlur={() => handleBlur('description')}
                          onKeyDown={(e) => handleKeyDown(e, 'description')}
                          autoFocus
                          disabled={loading}
                          maxLength="1000"
                          rows="10"
                          style={{ width: '100%', fontSize: '0.9rem' }}
                        />
                      ) : (
                        selectedProduct.description
                      )}
                    </p>
                    {enableEdit &&
                      !editFields['description'] &&
                      editFields.hoverDescription && (
                        <p
                          className="edit-btn"
                          onClick={() => handleEdit('description')}
                        >
                          <LuTextCursorInput />
                        </p>
                      )}
                  </div>
                </div>
              </div>

              <MyBusinessProductFeedback
                productId={selectedProduct.id}
                businessId={businessId}
                canDelete={true}
              />
              {error && <p style={{ color: 'red' }}>{error}</p>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      ,
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div
            style={{
              position: 'fixed', // Thêm 'position: "fixed"'
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 9999,
            }}
            onClick={() => setIsDeleteModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: '#fff',
                padding: '30px',
                borderRadius: '10px',
                maxWidth: '350px',
                width: '90%',
                textAlign: 'center',
                boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
              }}
            >
              <h3>Xác nhận xóa</h3>
              <p style={{ margin: '15px 0' }}>
                Bạn có chắc chắn muốn xóa ảnh này không?
              </p>
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '10px 20px',
                    cursor: 'pointer',
                    background: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    fontWeight: 'bold',
                  }}
                >
                  Hủy
                </button>

                <button
                  onClick={executeDeleteImage}
                  style={{
                    flex: 1,
                    padding: '10px 20px',
                    cursor: 'pointer',
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    fontWeight: 'bold',
                  }}
                >
                  Xóa
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>,
    modalRoot
  );
};

export default BusinessProductModal;
