import { useState, useEffect } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import "../../css/BusinessRegistrationPage.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getCurrentUserId } from "../../utils/useCurrentUserId";
import { toast } from "react-toastify";
import { convertFilesToBase64 } from "../../utils/imageToBase64";
import { uploadToCloudinary } from "../../utils/uploadToCloudinary";
import { sendEmail } from "../../utils/sendEmail";
import MapModal from "../../components/MapModal";

const BusinessRegistrationPage = () => {
  const navigate = useNavigate();
  const [images, setImages] = useState(() => {
    const savedImages = localStorage.getItem("businessImages");
    return savedImages ? JSON.parse(savedImages) : [];
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState(() => {
    const savedData = localStorage.getItem("businessFormData");
    return savedData
      ? JSON.parse(savedData)
      : {
          businessName: "",
          businessAddress: "",
          businessDescription: "",
          businessType: "",
          businessPhone: "",
          operatingHoursFrom: "",
          operatingHoursTo: "",
        };
  });
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [creatingBusiness, setCreatingBusiness] = useState(false);
  const userId = getCurrentUserId();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_BE_URL}/api/category`
        );
        setCategories(response.data.categories || []);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError("Không thể tải dữ liệu loại hình kinh doanh.");
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, [userId]);

  const handleAddImage = async (event) => {
    const files = Array.from(event.target.files);
    try {
      const uploadedUrls = await uploadToCloudinary(files);
      setImages((prev) => [...prev, ...uploadedUrls]);
    } catch (err) {
      toast.error("Không thể tải ảnh lên Cloudinary");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.businessName || !formData.businessName.trim()) {
      toast.error(
        <div>
          <b>Tên doanh nghiệp</b> là bắt buộc và phải có nội dung.
        </div>
      );
      return;
    }

    if (!formData.businessType || !formData.businessType.trim()) {
      toast.error(
        <div>
          <b>Loại hình doanh nghiệp</b> là bắt buộc và phải có nội dung.
        </div>
      );
      return;
    }

    if (!formData.businessAddress || !formData.businessAddress.trim()) {
      toast.error(
        <div>
          <b>Địa chỉ doanh nghiệp</b> là bắt buộc và phải có nội dung.
        </div>
      );
      return;
    }

    if (!selectedCoords.latitude || !selectedCoords.longitude) {
      toast.error(
        <div>
          Kinh độ/vĩ độ<b></b> là bắt buộc và phải có nội dung.
        </div>
      );
      return;
    }

    if (!formData.businessPhone || !formData.businessPhone.trim()) {
      toast.error(
        <div>
          <b>Số điện thoại doanh nghiệp</b> là bắt buộc và phải có nội dung.
        </div>
      );
      return;
    }

    if (!formData.operatingHoursFrom || !formData.operatingHoursFrom.trim()) {
      toast.error(
        <div>
          <b>Giờ mở cửa doanh nghiệp</b> là bắt buộc và phải có nội dung.
        </div>
      );
      return;
    }

    if (!formData.operatingHoursTo || !formData.operatingHoursTo.trim()) {
      toast.error(
        <div>
          <b>Giờ đóng cửa doanh nghiệp</b> là bắt buộc và phải có nội dung.
        </div>
      );
      return;
    }

    if (!images || images.length === 0) {
      toast.error(
        <div>
          <b>Hình ảnh doanh nghiệp</b> là bắt buộc. Vui lòng thêm ít nhất một
          hình ảnh.
        </div>
      );
      return;
    }

    setCreatingBusiness(true);

    const toastId = toast.loading("Đang tạo doanh nghiệp...");

    try {
      const businessData = {
        owner_id: userId,
        business_name: formData.businessName,
        business_address: formData.businessAddress,
        business_location: {
          type: "Point",
          coordinates: [selectedCoords.longitude, selectedCoords.latitude],
        },
        business_category_id: formData.businessType,
        business_detail: formData.businessDescription,
        business_time: {
          open: formData.operatingHoursFrom,
          close: formData.operatingHoursTo,
        },
        business_phone: formData.businessPhone,
        business_image: images,
        business_total_vote: 0,
        business_rating: 0,
        business_view: 0,
        business_status: false,
        business_active: "pending",
      };

      await axios.post(
        `${import.meta.env.VITE_BE_URL}/api/business`,
        businessData
      );

      const emailParams = {
        email: import.meta.env.VITE_EMAILJS_ADMIN_EMAIL,
        business_name: formData.businessName,
      };

      try {
        await sendEmail(
          import.meta.env.VITE_EMAILJS_TEMPLATE_REAPPROVE_ID,
          emailParams
        );
      } catch (error) {
        console.error("Email error:", error);
      }

      toast.update(toastId, {
        render: "Doanh nghiệp đã được tạo thành công và đang chờ phê duyệt.",
        type: "success",
        isLoading: false,
        autoClose: 5000,
      });
      navigate("/auth-callback");
      localStorage.removeItem("businessFormData");
      localStorage.removeItem("businessImages");
    } catch (err) {
      console.error(
        "Error creating business:",
        err.response ? err.response.data : err.message
      );
      toast.update(toastId, {
        render: `Không thể tạo doanh nghiệp. Chi tiết: ${err.message}`,
        type: "error",
        isLoading: false,
        autoClose: 7000,
      });
    } finally {
      setCreatingBusiness(false);
    }
  };

  const formatPrice = (price) => {
    if (price >= 1000000000)
      return `${(price / 1000000000).toFixed(1)}B / tháng`;
    if (price >= 1000000) return `${(price / 1000000).toFixed(1)}M / tháng`;
    if (price >= 1000) return `${(price / 1000).toFixed(1)}K / tháng`;
    return `${price}/tháng`;
  };

  return (
    <>
      <Header />
      <main className="business-register-container">
        <div className="business-register-intro-card">
          <h2 className="business-register-intro-title">
            Chào mừng các doanh nghiệp đến với hệ thống Local Assistant HOLA!
          </h2>
          <div className="business-register-intro-section">
            <div className="business-register-intro-text">
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
            <div className="business-register-intro-image">
              <img src="/1.png" alt="Product Illustration" />
            </div>
          </div>
        </div>

        <h2 className="business-register-page-title">
          Điền thông tin doanh nghiệp
        </h2>
        <form className="business-register-form" onSubmit={handleSubmit}>
          <div className="business-register-form-wrapper">
            <div className="business-register-form-columns">
              <div className="business-register-form-column left">
                <div className="business-register-form-group">
                  <label htmlFor="business-name">
                    Tên doanh nghiệp<span style={{ color: "red" }}> *</span>
                  </label>
                  <input
                    type="text"
                    id="business-name"
                    name="businessName"
                    placeholder="Nhập tên doanh nghiệp..."
                    value={formData.businessName}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="business-register-form-group">
                  <label htmlFor="business-address">
                    Địa chỉ<span style={{ color: "red" }}> *</span>
                  </label>
                  <input
                    type="text"
                    id="business-address"
                    name="businessAddress"
                    placeholder="Nhập địa chỉ..."
                    value={formData.businessAddress}
                    onChange={handleInputChange}
                    disabled
                  />
                </div>
                <div className="business-register-form-group">
                  <label htmlFor="business-description">Mô tả</label>
                  <textarea
                    id="business-description"
                    name="businessDescription"
                    placeholder="Nhập mô tả..."
                    value={formData.businessDescription}
                    onChange={handleInputChange}
                    rows="7"
                  />
                </div>
                <div className="business-register-form-group">
                  <label htmlFor="business-image">
                    Hình ảnh<span style={{ color: "red" }}> *</span>
                  </label>
                  <div className="business-register-image-upload">
                    {images.map((image, index) => (
                      <div
                        key={index}
                        className="business-register-image-preview"
                      >
                        <button
                          type="button"
                          className="remove-image-btn"
                          onClick={() => {
                            const newImages = [...images];
                            newImages.splice(index, 1);
                            setImages(newImages);
                          }}
                        >
                          ×
                        </button>
                        <img src={image} alt={`Preview ${index + 1}`} />
                      </div>
                    ))}
                    <input
                      type="file"
                      id="add-image-input"
                      className="business-register-add-image-input"
                      accept="image/*"
                      multiple
                      onChange={handleAddImage}
                    />
                    <button
                      type="button"
                      className="business-register-add-image-btn"
                      onClick={() =>
                        document.getElementById("add-image-input").click()
                      }
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="business-register-form-column right">
                <div className="business-register-form-group">
                  <label htmlFor="business-type">
                    Loại hình kinh doanh<span style={{ color: "red" }}> *</span>
                  </label>
                  {loading ? (
                    <p>Đang tải...</p>
                  ) : error ? (
                    <p>{error}</p>
                  ) : (
                    <select
                      id="business-type"
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleInputChange}
                    >
                      <option value="">Lựa chọn...</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.category_name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="business-register-form-group">
                  <label htmlFor="geolocate">
                    Kinh độ/Vĩ độ<span style={{ color: "red" }}> *</span>
                  </label>
                  <div className="business-register-geolocate">
                    <input
                      type="text"
                      value={
                        selectedCoords
                          ? `${selectedCoords.latitude.toFixed(
                              6
                            )}, ${selectedCoords.longitude.toFixed(6)}`
                          : ""
                      }
                      readOnly
                      disabled
                    />
                    <button
                      type="button"
                      className="business-register-geolocate-btn"
                      onClick={() => setIsMapOpen(true)}
                    >
                      Mở bản đồ chọn vị trí
                    </button>
                  </div>
                  <span className="business-register-geolocate-note">
                    *Vui lòng ở tại doanh nghiệp để lấy được tọa độ chính xác
                    nhất
                  </span>
                </div>
                <div className="business-register-form-group">
                  <label htmlFor="business-phone">
                    Số điện thoại<span style={{ color: "red" }}> *</span>
                  </label>
                  <input
                    type="number"
                    id="business-phone"
                    name="businessPhone"
                    placeholder="Nhập số điện thoại..."
                    value={formData.businessPhone}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="business-register-form-group">
                  <label htmlFor="operating-hours">
                    Thời gian hoạt động<span style={{ color: "red" }}> *</span>
                  </label>
                  <div className="business-register-operating-hours-inputs">
                    <input
                      type="time"
                      id="operating-hours-from"
                      name="operatingHoursFrom"
                      placeholder="Từ ..."
                      value={formData.operatingHoursFrom}
                      onChange={handleInputChange}
                    />
                    <input
                      type="time"
                      id="operating-hours-to"
                      name="operatingHoursTo"
                      placeholder="Đến ..."
                      value={formData.operatingHoursTo}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="business-register-submit-btn-container">
              <button
                type="submit"
                className="business-register-submit-btn"
                disabled={creatingBusiness}
              >
                {creatingBusiness ? " Đang xử lý..." : "Đăng ký"}
              </button>
            </div>
          </div>
        </form>
      </main>
      <MapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onConfirm={async (coords) => {
          const [lat, lng] = coords;

          const toastId = toast.loading("Đang lấy địa chỉ...");

          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
            );
            const data = await response.json();
            const newAddress = data.display_name || "Địa chỉ chưa rõ";

            setFormData((prev) => ({
              ...prev,
              businessAddress: newAddress,
            }));

            setSelectedCoords({
              latitude: lat,
              longitude: lng,
            });

            toast.update(toastId, {
              render: "Lấy địa chỉ thành công!",
              type: "success",
              isLoading: false,
              autoClose: 3000,
            });
          } catch (err) {
            toast.update(toastId, {
              render: "Không thể lấy địa chỉ. Vui lòng thử lại.",
              type: "error",
              isLoading: false,
              autoClose: 3000,
            });
          }

          setIsMapOpen(false);
        }}
      />
      <Footer />
    </>
  );
};

export default BusinessRegistrationPage;
