import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { convertFilesToBase64 } from '../utils/imageToBase64';
import '../css/ProductDetailModal.css';
import MyBusinessProductFeedback from './MyBusinessProductFeedback';
import { LuTextCursorInput } from "react-icons/lu";
import { toast } from 'react-toastify';


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

  const handleEdit = (field) => {
    setEditFields((prev) => ({ ...prev, [field]: true }));
    setEditedValues((prev) => ({
      ...prev,
      [field]: field === 'price' ? parseFloat(selectedProduct[field]).toString() : selectedProduct[field] || '',
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
    if (editedValues[field] !== selectedProduct[field]) {
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
              p._id === selectedProduct.id
                ? { ...p, [apiField]: value }
                : p
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

    try {
      const base64Images = await convertFilesToBase64(files);
      setNewImages((prevImages) => [...prevImages, ...base64Images]);
      setError(null);
    } catch (error) {
      console.error('Error converting images to base64:', error);
      setError('Không thể chuyển đổi ảnh. Vui lòng thử lại.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSaveImages = async () => {
    if (newImages.length > 0 && selectedProduct) {
      setLoading(true);
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

        const updatedProduct = await response.json();

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
        toast.success('Lưu ảnh thành công!');
      } catch (err) {
        console.error('Error saving images:', err);
        setError(
          'Không thể lưu ảnh. Vui lòng kiểm tra kết nối hoặc liên hệ admin.'
        );
        toast.error('Không thể lưu ảnh. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteImage = async (index) => {
    if (allThumbnails.length === 1) {
      toast.warning('Sản phẩm phải có ít nhất một ảnh.');
      return;
    }

    const confirmDelete = window.confirm('Bạn có chắc muốn xóa ảnh này không?');
    if (!confirmDelete) return;

    setLoading(true);

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

      const updatedNewImages = newImages.filter(
        (img) => updatedThumbnails.includes(img)
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
      toast.success('Xóa ảnh thành công!');
    } catch (err) {
      console.error('Error deleting image:', err);
      setError('Không thể xóa ảnh. Vui lòng thử lại.');
      toast.error('Không thể xóa ảnh. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const allThumbnails = [...(selectedProduct?.thumbnails || []), ...(newImages || [])];
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
                        className={`thumbnail ${selectedImage === idx ? 'active' : ''}`}
                        style={{ position: 'relative', cursor: 'pointer' }}
                        onClick={() => setSelectedImage(idx)}
                      >
                        <img
                          src={thumb || '1.png'}
                          alt={`${selectedProduct.name} thumbnail ${idx + 1}`}
                          onError={(e) => (e.target.src = '1.png')}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
                            x
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
                            marginTop: '0.5rem',
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
                      />
                    ) : (
                      selectedProduct.name
                    )}
                  </h1>
                  {enableEdit && !editFields['name'] && editFields.hoverName && (
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
                        selectedProduct.price
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
                  <div className="stars">{renderStars(selectedProduct.rating)}</div>
                  <span className="rating-count">{selectedProduct.reviews}</span>
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
                  <p className="business-description">
                    {editFields['description'] ? (
                      <textarea
                        value={editedValues['description'] || ''}
                        onChange={(e) => handleChange(e, 'description')}
                        onBlur={() => handleBlur('description')}
                        onKeyDown={(e) => handleKeyDown(e, 'description')}
                        autoFocus
                        disabled={loading}
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

            <MyBusinessProductFeedback productId={selectedProduct.id} businessId={businessId} />
            {error && <p style={{ color: 'red' }}>{error}</p>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    modalRoot
  );
};

export default BusinessProductModal;