import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import '../../css/DashboardPage.css';

const BACKEND_URL = 'http://localhost:3000';

// === COMPONENT MODAL SỬA SẢN PHẨM ===
// Component này CHỈ cập nhật tồn kho
const EditProductModal = ({ product, isOpen, onClose, onSuccess }) => {
  // 1. State chỉ quản lý số lượng tồn kho
  const [stock, setStock] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      // Đọc từ product_number
      setStock(product.product_number || 0);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const handleChange = (e) => {
    setStock(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // 2. Gọi API PATCH chuyên dụng (backend đã có)
      // API này chỉ cập nhật số lượng (đã sửa thành product_number)
      await axios.patch(`${BACKEND_URL}/api/product/${product._id}/amount`, {
        // Controller của bạn đọc key tên là 'amount'
        amount: Number(stock),
      });

      toast.success('Cập nhật tồn kho thành công!');
      onSuccess(); // Tải lại danh sách
      onClose(); // Đóng modal
    } catch (err) {
      console.error('Failed to update product stock:', err);
      toast.error(err.response?.data?.error || 'Lỗi khi cập nhật tồn kho');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <form onSubmit={handleSubmit}>
          <h2>Cập nhật Tồn kho</h2>

          {/* 3. Hiển thị Tên và Giá ở dạng "disabled" (không sửa được) */}
          <div className="form-group">
            <label htmlFor="product_name">Tên sản phẩm</label>
            <input
              type="text"
              id="product_name"
              name="product_name"
              value={product.product_name || ''}
              disabled // Vô hiệu hóa
              style={{ backgroundColor: '#eee' }} // Thêm style cho rõ
            />
          </div>
          <div className="form-group">
            <label htmlFor="product_price">Giá (VND)</label>
            <input
              type="text"
              id="product_price"
              name="product_price"
              value={product.product_price || ''}
              disabled // Vô hiệu hóa
              style={{ backgroundColor: '#eee' }} // Thêm style cho rõ
            />
          </div>

          {/* 4. Chỉ cho phép sửa Tồn kho */}
          <div className="form-group">
            <label htmlFor="product_number">Số lượng tồn kho</label>
            <input
              type="number"
              id="product_number"
              name="product_number"
              value={stock} // Dùng state 'stock'
              onChange={handleChange}
              required
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary dashboard-btn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn-primary dashboard-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// === COMPONENT CHÍNH CỦA TRANG STOCK ===
const StockPage = () => {
  // (Các state... giữ nguyên)
  const [businessId, setBusinessId] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appStatus, setAppStatus] = useState('Đang tải...');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const { userId } = useAuth();
  const navigate = useNavigate();

  // (useEffect lấy businessId... giữ nguyên)
  useEffect(() => {
    if (userId) {
      setAppStatus('Đang tải thông tin business...');
      axios
        .get(`${BACKEND_URL}/api/business/owner/${userId}`)
        .then((res) => {
          if (res.data && res.data.length > 0) {
            setBusinessId(res.data[0]._id);
          } else {
            setAppStatus('Không tìm thấy business.');
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error('Failed to fetch business:', err);
          setAppStatus('Lỗi tải business.');
          setLoading(false);
        });
    }
  }, [userId]);

  // (fetchProducts... giữ nguyên)
  const fetchProducts = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `${BACKEND_URL}/api/product/business/${businessId}?limit=1000`
      );
      setProducts(res.data.products || []);
      setAppStatus('');
    } catch (err) {
      console.error('Failed to fetch products:', err);
      toast.error('Không thể tải danh sách sản phẩm');
      setAppStatus('Lỗi tải sản phẩm.');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // (Các hàm xử lý sự kiện... giữ nguyên)
  const handleNavigateToCreate = () => {
    navigate('/product-registration');
  };

  const handleOpenEditModal = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (!productId) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      return;
    }
    try {
      await axios.delete(`${BACKEND_URL}/api/product/${productId}`);
      toast.success('Xóa sản phẩm thành công!');
      fetchProducts();
    } catch (err) {
      console.error('Failed to delete product:', err);
      toast.error(err.response?.data?.error || 'Lỗi khi xóa sản phẩm');
    }
  };

  const formatCurrency = (amount) => {
    const numberAmount = parseFloat(amount);
    if (!isNaN(numberAmount)) {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(numberAmount);
    }
    return amount;
  };

  // (renderTableBody... đã sửa để đọc product_number)
  const renderTableBody = () => {
    if (loading || (appStatus && !products.length)) {
      return (
        <tr>
          <td colSpan="5" style={{ textAlign: 'center' }}>
            {appStatus || 'Đang tải...'}
          </td>
        </tr>
      );
    }
    if (products.length === 0) {
      return (
        <tr>
          <td colSpan="5" style={{ textAlign: 'center' }}>
            Chưa có sản phẩm nào.
          </td>
        </tr>
      );
    }
    return products.map((product) => (
      <tr key={product._id}>
        <td>{product.product_name}</td>
        <td>
          <img
            src={product.product_image?.[0] || '/1.png'}
            alt={product.product_name}
            style={{
              width: '60px',
              height: '60px',
              objectFit: 'cover',
              borderRadius: '4px',
            }}
            onError={(e) => {
              e.target.src = '/1.png';
            }}
          />
        </td>
        <td>{formatCurrency(product.product_price)}</td>

        <td>{product.product_number ?? 0}</td>

        <td>
          <button
            className="edit-btn dashboard-btn"
            style={{ backgroundColor: '#ffc107', color: 'black' }}
            onClick={() => handleOpenEditModal(product)}
          >
            <FaEdit />
          </button>
          <button
            className="delete-btn"
            onClick={() => handleDeleteProduct(product._id)}
          >
            <FaTrash />
          </button>
        </td>
      </tr>
    ));
  };

  return (
    <>
      <ToastContainer autoClose={3000} />
      {createPortal(
        <EditProductModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          product={selectedProduct}
          onSuccess={fetchProducts}
        />,
        document.body
      )}

      <div className="main-content">
        <div className="business-card table-section">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
            }}
          >
            <h2 className="card-title" style={{ margin: 0 }}>
              Quản lý Kho hàng
            </h2>
            <div className="table-actions">
              <button
                className="add-btn"
                onClick={handleNavigateToCreate}
                disabled={!businessId}
              >
                <FaPlus style={{ marginRight: '5px' }} /> Thêm sản phẩm mới
              </button>
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '35%' }}>Tên sản phẩm</th>
                <th style={{ width: '15%' }}>Ảnh</th>
                <th style={{ width: '20%' }}>Giá</th>
                <th style={{ width: '15%' }}>Tồn kho</th>
                <th style={{ width: '15%' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>{renderTableBody()}</tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default StockPage;
