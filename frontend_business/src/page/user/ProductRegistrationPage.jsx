import React, { useState, useEffect } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import "../../css/ProductRegistrationPage.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getCurrentUserId } from "../../utils/useCurrentUserId";
import { convertFilesToBase64 } from "../../utils/imageToBase64";
import { uploadToCloudinary } from "../../utils/uploadToCloudinary";
import { toast } from "react-toastify";

const ProductRegistrationPage = () => {
  const navigate = useNavigate();
  const userId = getCurrentUserId();
  const [images, setImages] = useState([]);
  const [formData, setFormData] = useState({
    productName: "",
    productDescription: "",
    productPrice: "",
    productNumber: "",
    policyConfirmation: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAddImage = async (event) => {
    const files = Array.from(event.target.files);

    // MỚI: Sử dụng toast.loading để có thể update
    const toastId = toast.loading("Đang tải ảnh lên Cloudinary...");

    try {
      const uploadedUrls = await uploadToCloudinary(files);
      setImages((prevImages) => [...prevImages, ...uploadedUrls]);

      // MỚI: Cập nhật toast khi thành công
      toast.update(toastId, {
        render: "Upload ảnh thành công!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error uploading images:", error);

      // MỚI: Cập nhật toast khi thất bại
      toast.update(toastId, {
        render: "Không thể tải ảnh lên Cloudinary.",
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    }
  };

  // MỚI: Hàm riêng để xóa ảnh và thêm toast
  const handleRemoveImage = (indexToRemove) => {
    setImages(images.filter((_, i) => i !== indexToRemove));
    toast.success("Đã xóa ảnh", { autoClose: 2000 });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Tên sản phẩm
    if (!formData.productName.trim()) {
      toast.error("Tên sản phẩm là bắt buộc.");
      setLoading(false);
      return;
    }
    // MỚI: Validate độ dài tên
    if (formData.productName.trim().length > 100) {
      toast.error("Tên sản phẩm không được vượt quá 100 ký tự.");
      setLoading(false);
      return;
    }

    // 2. Giá thành
    // CẬP NHẬT: Validate giá >= 1000
    if (!formData.productPrice || formData.productPrice < 1000) {
      toast.error("Giá thành phải ít nhất là 1,000.");
      setLoading(false);
      return;
    }

    // 3. Số lượng
    if (!formData.productNumber || formData.productNumber <= 0) {
      toast.error("Số lượng phải là số dương.");
      setLoading(false);
      return;
    }

    // MỚI: Validate mô tả
    if (formData.productDescription.trim().length > 1000) {
      toast.error("Mô tả sản phẩm không được vượt quá 1000 ký tự.");
      setLoading(false);
      return;
    }

    // 4. Chính sách
    if (!formData.policyConfirmation) {
      toast.error("Vui lòng xác nhận tuân thủ chính sách.");
      setLoading(false);
      return;
    }

    // 5. Hình ảnh
    if (images.length === 0) {
      toast.error("Vui lòng thêm ít nhất một hình ảnh.");
      setLoading(false);
      return;
    }

    try {
      // Lấy danh sách doanh nghiệp của user
      const businessesResponse = await axios.get(
        `${import.meta.env.VITE_BE_URL}/api/business`,
        {
          headers: { "Content-Type": "application/json" },
          params: { page: 1, limit: 100 },
        }
      );
      let businesses = businessesResponse.data;
      if (businesses.businesses && Array.isArray(businesses.businesses)) {
        businesses = businesses.businesses; // Lấy mảng businesses nếu có
      } else if (!Array.isArray(businesses)) {
        throw new Error("Dữ liệu từ API không phải là mảng doanh nghiệp.");
      }

      const userBusiness = businesses.find((b) => b.owner_id === userId);
      if (!userBusiness) {
        throw new Error("Không tìm thấy doanh nghiệp của bạn.");
      }
      const businessId = userBusiness._id;

      const productData = {
        business_id: businessId,
        product_name: formData.productName,
        product_description: formData.productDescription,
        product_image: images,
        product_price: parseInt(formData.productPrice),
        product_number: parseInt(formData.productNumber),
        product_total_vote: 0,
        product_rating: 0,
      };

      await axios.post(
        `${import.meta.env.VITE_BE_URL}/api/product`,
        productData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      toast.success("Sản phẩm đã được tạo thành công.");
      navigate("/my-business");
    } catch (err) {
      console.error(
        "Error creating product:",
        err.response ? err.response.data : err.message
      );
      setError(`Không thể tạo sản phẩm. Chi tiết: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="product-registration-container">
        <div className="intro-card">
          <h2 className="intro-title">
            Đọc kỹ các hướng dẫn trước khi đăng ký sản phẩm của bạn!
          </h2>
          <div className="intro-section">
            <div className="intro-text">
              <strong>Chính sách đăng tải nội dung và sản phẩm</strong>
              <ul>
                <li>
                  Chỉ cho phép đăng các sản phẩm và dịch vụ hợp pháp theo quy
                  định pháp luật của Việt Nam.
                </li>
                <li>
                  Cấm quảng cáo sai sự thật, thông tin gây hiểu lầm hoặc gian
                  lận.
                </li>
                <li>
                  Không được đăng sản phẩm vi phạm pháp luật như hàng giả, hàng
                  cấm, vũ khí, nội dung nhạy cảm, ...
                </li>
                <li>
                  Hình ảnh và mô tả sản phẩm phải chính xác, rõ ràng và do doanh
                  nghiệp sở hữu.
                </li>
              </ul>

              <strong>Chính sách ứng xử của người dùng và doanh nghiệp</strong>
              <ul>
                <li>
                  Cấm hành vi spam, quấy rối, hoặc sử dụng hình thức tiếp thị
                  quá mức gây phiền hà.
                </li>
                <li>
                  Doanh nghiệp tự chịu trách nhiệm về dịch vụ khách hàng và xử
                  lý khiếu nại.
                </li>
                <li>Vi phạm nhiều lần có thể bị khóa tài khoản vĩnh viễn.</li>
              </ul>
            </div>
            <div className="intro-image">
              <img src="/1.png" alt="Product Illustration" />
            </div>
          </div>
        </div>
        <h1 className="page-title">Đăng ký sản phẩm</h1>
        <form className="registration-form" onSubmit={handleSubmit}>
          <div className="form-columns">
            <div className="form-column left">
              <div className="form-group">
                <label htmlFor="product-name">Tên sản phẩm</label>
                <input
                  type="text"
                  id="product-name"
                  name="productName"
                  value={formData.productName}
                  onChange={handleInputChange}
                  placeholder="Nhập ..."
                  maxLength="100"
                />
                {/* MỚI: Thêm dòng hiển thị giới hạn */}
                <small className="form-field-hint">Tối đa 100 ký tự</small>
              </div>
              <div className="form-group">
                <label htmlFor="product-description">Mô tả sản phẩm</label>
                <textarea
                  id="product-description"
                  name="productDescription"
                  value={formData.productDescription}
                  onChange={handleInputChange}
                  placeholder="Nhập ..."
                  maxLength="1000"
                ></textarea>
                {/* MỚI: Thêm dòng hiển thị giới hạn */}
                <small className="form-field-hint">Tối đa 1000 ký tự</small>
              </div>
              <div className="form-group">
                <label htmlFor="product-image">Hình ảnh</label>
                <div className="image-upload">
                  {images.map((image, index) => (
                    <div key={index} className="image-preview">
                      <img
                        src={image}
                        alt={`Preview ${index + 1}`}
                        style={{ width: "100px", height: "100px" }}
                      />
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => handleRemoveImage(index)} // CẬP NHẬT
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <label className="add-image-btn">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAddImage}
                      style={{ display: "none" }}
                      multiple
                    />
                  </label>
                </div>
              </div>
            </div>
            <div className="form-column right">
              <div className="form-group">
                <label htmlFor="product-price">Giá thành</label>
                <input
                  type="number"
                  id="product-price"
                  name="productPrice"
                  value={formData.productPrice}
                  onChange={handleInputChange}
                  placeholder="Nhập ..."
                  min="1000" // MỚI: Thêm min để trình duyệt hỗ trợ
                />
              </div>
              <div className="form-group">
                <label htmlFor="product-number">Số lượng</label>
                <input
                  type="number"
                  id="product-number"
                  name="productNumber"
                  value={formData.productNumber}
                  onChange={handleInputChange}
                  placeholder="Nhập ..."
                  min="1" // CẬP NHẬT: Thêm min
                />
              </div>
            </div>
          </div>
          <div className="product-reg form-group checkbox-group">
            <input
              type="checkbox"
              id="policy-confirmation"
              name="policyConfirmation"
              checked={formData.policyConfirmation}
              onChange={handleInputChange}
            />
            <label htmlFor="policy-confirmation" className="checkbox-label">
              Xác nhận tuân thủ chính sách nền tảng
            </label>
          </div>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Đang xử lý..." : "Đăng ký"}
          </button>
          {error && <p style={{ color: "red" }}>{error}</p>}
        </form>
      </main>
      <Footer />
    </>
  );
};

export default ProductRegistrationPage;
