import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import "../../css/StockPage.css";
import "../../css/DashboardPage.css";
import { motion, AnimatePresence } from "framer-motion";

const BACKEND_URL = import.meta.env.VITE_BE_URL;

const EditProductModal = ({ product, isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    product_name: "",
    product_price: "",
    product_number: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        product_name: product.product_name || "",
        product_price: product.product_price || "",
        product_number: product.product_number || 0,
      });
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    const stockAmount = Number(formData.product_number);
    if (isNaN(stockAmount) || stockAmount < 0) {
      toast.error("Số lượng tồn kho không thể âm.");
      return;
    }
    const price = parseFloat(formData.product_price);
    if (!isNaN(price) && price < 1000) {
      toast.error("Giá sản phẩm phải lớn hơn hoặc bằng 1.000.");
      return;
    }
    setIsSubmitting(true);

    try {
      await axios.put(`${BACKEND_URL}/api/product/${product._id}`, {
        product_name: formData.product_name,
        product_price: price,
        product_number: stockAmount,
      });

      toast.success("Cập nhật tồn kho thành công!");
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to update product stock:", err);
      toast.error(err.response?.data?.error || "Lỗi khi cập nhật tồn kho");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <form onSubmit={handleSubmit}>
          <h2>Cập nhật Tồn kho</h2>

          <div className="form-group">
            <label htmlFor="product_name">Tên sản phẩm</label>
            <input
              type="text"
              id="product_name"
              name="product_name"
              value={formData.product_name}
              onChange={handleChange}
              required
              maxLength="100"
            />
            <small className="form-field-hint">Tối đa 100 ký tự.</small>
          </div>
          <div className="form-group">
            <label htmlFor="product_price">Giá (VND)</label>
            <input
              type="number"
              id="product_price"
              name="product_price"
              value={formData.product_price}
              onChange={handleChange}
              required
              min="1000"
              max="999999999"
            />
            <small className="form-field-hint">
              Nhập giá trị từ 1000 đến 999,999,999.
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="product_number">Số lượng tồn kho</label>
            <input
              type="number"
              id="product_number"
              name="product_number"
              value={formData.product_number}
              onChange={handleChange}
              required
              min="0"
              max="9999"
            />
            <small className="form-field-hint">
              Nhập số lượng từ 0 đến 9,999.
            </small>
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
              {isSubmitting ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const InlineStockEditor = ({ product, onSuccess }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateStock = async (newAmount) => {
    if (isUpdating || newAmount < 0) return;

    setIsUpdating(true);

    try {
      await axios.patch(`${BACKEND_URL}/api/product/${product._id}/amount`, {
        amount: Number(newAmount),
      });
      onSuccess();
    } catch (err) {
      console.error("Failed to update stock:", err);
      toast.error("Lỗi cập nhật tồn kho");
    } finally {
      setTimeout(() => setIsUpdating(false), 10);
    }
  };

  return (
    <div className="inline-stock-editor">
      <button
        className="inline-stock-btn"
        onClick={() => handleUpdateStock(product.product_number - 1)}
        disabled={isUpdating || product.product_number <= 0}
      >
        -
      </button>

      <span>{isUpdating ? "..." : product.product_number ?? 0}</span>

      <button
        className="inline-stock-btn"
        onClick={() => handleUpdateStock(product.product_number + 1)}
        disabled={isUpdating}
      >
        +
      </button>
    </div>
  );
};

const StockPage = () => {
  const [businessId, setBusinessId] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appStatus, setAppStatus] = useState("Đang tải...");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productIdToDelete, setProductIdToDelete] = useState(null);

  const { userId } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (userId) {
      setAppStatus("Đang tải thông tin business...");
      axios
        .get(`${BACKEND_URL}/api/business/owner/${userId}`)
        .then((res) => {
          if (res.data && res.data.length > 0) {
            setBusinessId(res.data[0]._id);
          } else {
            setAppStatus("Không tìm thấy business.");
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch business:", err);
          setAppStatus("Lỗi tải business.");
          setLoading(false);
        });
    }
  }, [userId]);

  const fetchProducts = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `${BACKEND_URL}/api/product/business/${businessId}?limit=1000`
      );
      setProducts(res.data.products || []);
      setAppStatus("");
    } catch (err) {
      console.error("Failed to fetch products:", err);
      toast.error("Không thể tải danh sách sản phẩm");
      setAppStatus("Lỗi tải sản phẩm.");
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleNavigateToCreate = () => {
    navigate("/product-registration");
  };

  const handleOpenEditModal = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = (productId) => {
    if (!productId) return;
    setProductIdToDelete(productId);
    setIsDeleteModalOpen(true);
  };

  const executeDeleteProduct = async () => {
    if (!productIdToDelete) return;

    setIsDeleteModalOpen(false);
    const toastId = toast.loading("Đang xóa sản phẩm...");

    try {
      await axios.delete(`${BACKEND_URL}/api/product/${productIdToDelete}`); // Cập nhật toast
      toast.update(toastId, {
        render: "Xóa sản phẩm thành công!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
      fetchProducts();
    } catch (err) {
      console.error("Failed to delete product:", err); // Cập nhật toast
      toast.update(toastId, {
        render: err.response?.data?.error || "Lỗi khi xóa sản phẩm",
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setProductIdToDelete(null);
    }
  };

  const formatCurrency = (amount) => {
    const numberAmount = parseFloat(amount);
    if (!isNaN(numberAmount)) {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(numberAmount);
    }
    return amount;
  };

  const renderTableBody = () => {
    if (loading && products.length === 0) {
      return (
        <tr>
          <td colSpan="5" style={{ textAlign: "center" }}>
            {appStatus || "Đang tải..."}
          </td>
        </tr>
      );
    }
    if (products.length === 0) {
      return (
        <tr>
          <td colSpan="5" style={{ textAlign: "center" }}>
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
            src={product.product_image?.[0] || "/1.png"}
            alt={product.product_name}
            style={{
              width: "60px",
              height: "60px",
              objectFit: "cover",
              borderRadius: "4px",
            }}
            onError={(e) => {
              e.target.src = "/1.png";
            }}
          />
        </td>
        <td>{formatCurrency(product.product_price)}</td>

        <td>
          <InlineStockEditor product={product} onSuccess={fetchProducts} />
        </td>

        <td className="stock-action-buttons">
          <button
            className="stock-action-btn edit"
            onClick={() => handleOpenEditModal(product)}
          >
            <FaEdit />
          </button>
          <button
            className="stock-action-btn delete"
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

      {createPortal(
        <AnimatePresence>
          {isDeleteModalOpen && (
            <div
              className="modal-overlay"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              <motion.div
                className="modal-content"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: "400px" }}
              >
                <h2 style={{ marginTop: 0 }}>Xác nhận xóa</h2>
                <p style={{ margin: "15px 0", lineHeight: "1.5" }}>
                  Bạn có chắc chắn muốn xóa sản phẩm này? <br /> Hành động này
                  không thể hoàn tác.
                </p>
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary dashboard-btn"
                    onClick={() => setIsDeleteModalOpen(false)}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    // Thêm class "btn-danger" để có màu đỏ
                    className="btn-primary dashboard-btn btn-danger"
                    onClick={executeDeleteProduct}
                  >
                    Xóa
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <div className="stock-page-content">
        <div className="business-card table-section stock-table-card">
          <div className="stock-table-header">
            <h2 className="stock-table-title">Quản lý Kho hàng</h2>
            <div className="table-actions">
              <button
                className="stock-add-btn"
                onClick={handleNavigateToCreate}
                disabled={!businessId}
              >
                <FaPlus style={{ marginRight: "5px" }} /> Thêm sản phẩm mới
              </button>
            </div>
          </div>
          <table className="data-table stock-data-table">
            <thead>
              <tr>
                <th style={{ width: "35%" }}>Tên sản phẩm</th>
                <th style={{ width: "15%" }}>Ảnh</th>
                <th style={{ width: "20%" }}>Giá</th>
                <th style={{ width: "15%" }}>Tồn kho</th>
                <th style={{ width: "15%" }}>Hành động</th>
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
