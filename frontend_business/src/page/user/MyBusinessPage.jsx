import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import axios from "axios";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { FaPlus } from "react-icons/fa";
import BusinessProductModal from "../../components/BusinessProductModal";
import { getCurrentUserId } from "../../utils/useCurrentUserId";
import { uploadToCloudinary } from "../../utils/uploadToCloudinary";
import "../../css/MyBusinessPage.css";
import { sendEmail } from "../../utils/sendEmail";
import { toast } from "react-toastify";
import { LuTextCursorInput } from "react-icons/lu";
import LoadingScreen from "../../components/LoadingScreen";
import MapModal from "../../components/MapModal";
import MyBusinessFeedback from "../../components/MyBusinessFeedback";
import { FaEye, FaTrash } from "react-icons/fa6";
import { motion, AnimatePresence } from "framer-motion";
import { RxCross2 } from "react-icons/rx";

const MyBusinessPage = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [business, setBusiness] = useState(null);
  const [products, setProducts] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editFields, setEditFields] = useState({});
  const [editedValues, setEditedValues] = useState({});
  const [newImages, setNewImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const fileInputRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [planExpired, setPlanExpired] = useState(false);
  const [overallRating, setOverallRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState("0 Đánh giá");
  const [averageRating, setAverageRating] = useState(0);
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [imageIndexToDelete, setImageIndexToDelete] = useState(null);
  const [isProductDeleteModalOpen, setIsProductDeleteModalOpen] =
    useState(false);
  const [productIdToDelete, setProductIdToDelete] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BE_URL}/api/category`
        );
        setCategories(response.data.categories || []);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };

    fetchCategories();

    const fetchBusinessData = async () => {
      if (!user) {
        <>
          <Header />
          <LoadingScreen />
        </>;
        return;
      }

      const ownerId = getCurrentUserId();
      try {
        setLoading(true);
        setError(null);

        const businessesResponse = await axios.get(
          `${import.meta.env.VITE_BE_URL}/api/business`,
          {
            headers: { "Content-Type": "application/json" },
            params: { page: 1, limit: 10000 },
          }
        );
        let businesses = businessesResponse.data;

        if (!Array.isArray(businesses)) {
          if (businesses.businesses && Array.isArray(businesses.businesses)) {
            businesses = businesses.businesses;
          } else {
            throw new Error("Dữ liệu từ API không phải là mảng doanh nghiệp.");
          }
        }

        if (!businesses || businesses.length === 0) {
          setError(
            "Không tìm thấy doanh nghiệp nào từ API. Vui lòng kiểm tra kết nối hoặc dữ liệu."
          );
          setLoading(false);
          return;
        }

        const userBusiness = businesses.find((b) => b.owner_id === ownerId);
        if (!userBusiness) {
          setError(
            `Không tìm thấy doanh nghiệp nào cho owner với ID: ${ownerId}.`
          );
          setLoading(false);
          return;
        }

        const businessId = userBusiness._id;

        const results = await Promise.allSettled([
          axios.get(
            `${import.meta.env.VITE_BE_URL}/api/business/${businessId}`
          ),
          axios.get(
            `${import.meta.env.VITE_BE_URL}/api/product/business/${businessId}`
          ),
          axios.get(
            `${import.meta.env.VITE_BE_URL}/api/feedback/business/${businessId}`
          ),
        ]);

        const [businessResult, productsResult, feedbacksResult] = results;

        if (businessResult.status === "fulfilled") {
          setBusiness(businessResult.value.data);
          setIsOpen(businessResult.value.data.business_status || false);
        } else {
          throw new Error("Không thể tải thông tin doanh nghiệp");
        }

        if (productsResult.status === "fulfilled") {
          setProducts(productsResult.value.data?.products || []);
        } else {
          console.warn("Could not load products:", productsResult.reason);
          setProducts([]);
        }

        if (feedbacksResult.status === "fulfilled") {
          setFeedbacks(feedbacksResult.value.data?.data || []);
        } else {
          console.warn("Could not load feedbacks:", feedbacksResult.reason);
          setFeedbacks([]);
        }

        checkPlanExpiryAndUpdate(userBusiness);
      } catch (err) {
        console.error(
          "Error fetching business data:",
          err.response ? err.response.data : err.message
        );
        setError(
          `Không thể tải dữ liệu doanh nghiệp. Chi tiết: ${err.message}`
        );
      } finally {
        setLoading(false);
      }
    };

    const checkPlanExpiryAndUpdate = async (business) => {
      const plan = user?.unsafeMetadata?.userPlan;
      if (!plan?.date) return;

      const planDate = new Date(plan.date);
      const now = new Date();

      const diffInDays =
        (now.getTime() - planDate.getTime()) / (1000 * 60 * 60 * 24);

      if (
        diffInDays <= 30 &&
        plan.planDeactivated &&
        business.business_active !== "active"
      ) {
        try {
          await axios.put(
            `${import.meta.env.VITE_BE_URL}/api/business/${business._id}`,
            {
              business_active: "active",
            }
          );

          await user.update({
            unsafeMetadata: {
              ...user.unsafeMetadata,
              userPlan: {
                ...plan,
                planDeactivated: false,
              },
            },
          });
        } catch (err) {
          console.error("Error reactivating business:", err);
        }

        return;
      }

      if (diffInDays > 30) {
        setPlanExpired(true);

        if (plan.planNotified) return;

        try {
          await axios.put(
            `${import.meta.env.VITE_BE_URL}/api/business/${business._id}`,
            {
              business_active: "pending",
            }
          );

          const userRes = await axios.get(
            `${import.meta.env.VITE_BE_URL}/api/user/${business.owner_id}`
          );
          const owner = userRes.data.users;

          if (!owner?.email || !owner?.fullName) {
            console.warn("Missing owner email or name. Skipping email.");
            return;
          }

          await sendEmail(import.meta.env.VITE_EMAILJS_TEMPLATE_REJECT_ID, {
            email: owner.email,
            owner_name: owner.fullName,
            subject: "Gói đăng ký doanh nghiệp của bạn đã hết hạn",
            message_body: `
          Gói đăng ký của doanh nghiệp <strong>${business.business_name}</strong> đã hết hạn sau 30 ngày sử dụng.<br /><br />
          Trạng thái hiển thị của doanh nghiệp đã được chuyển về <strong>chờ duyệt</strong>.<br /><br />
          Vui lòng truy cập trang doanh nghiệp trên Local Assistant HOLA để chọn gói đăng ký mới và gia hạn dịch vụ.
        `,
          });

          await user.update({
            unsafeMetadata: {
              ...user.unsafeMetadata,
              userPlan: {
                ...user.unsafeMetadata.userPlan,
                planNotified: true,
                planDeactivated: true,
              },
            },
          });
        } catch (err) {
          console.error(
            "Error updating status or sending expiration email:",
            err
          );
        }
      }
    };

    fetchBusinessData();
  }, [user]);

  useEffect(() => {
    const fetchBusinessFeedback = async () => {
      if (!business?._id) return;

      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BE_URL}/api/feedback/business/${business._id}`
        );

        if (res.data?.success && Array.isArray(res.data.data)) {
          let feedbacks = res.data.data;

          if (showActiveOnly) {
            feedbacks = feedbacks.filter(
              (fb) => fb.feedback_status === "active"
            );
          }

          const total = feedbacks.reduce(
            (sum, fb) => sum + (fb.feedback_rating || 0),
            0
          );
          const avg = feedbacks.length > 0 ? total / feedbacks.length : 0;

          setOverallRating(avg);
          setTotalReviews(`${feedbacks.length} Đánh giá`);
        } else {
          setOverallRating(0);
          setTotalReviews("0 Đánh giá");
        }
      } catch (err) {
        console.error("Error fetching business feedback:", err);
        setOverallRating(0);
        setTotalReviews("0 Đánh giá");
      }
    };

    fetchBusinessFeedback();
  }, [business?._id, showActiveOnly]);

  useEffect(() => {
    const fetchAllProductFeedbacks = async () => {
      if (!products.length) return;

      try {
        const updatedProducts = await Promise.all(
          products.map(async (p) => {
            try {
              const res = await axios.get(
                `${import.meta.env.VITE_BE_URL}/api/feedback/product/${p._id}`
              );

              if (res.data?.success && Array.isArray(res.data.data)) {
                // Chỉ lấy feedback active
                const feedbacks = res.data.data.filter(
                  (fb) => fb.feedback_status === "active"
                );

                const total = feedbacks.reduce(
                  (sum, fb) => sum + (fb.feedback_rating || 0),
                  0
                );
                const avg = feedbacks.length > 0 ? total / feedbacks.length : 0;

                return {
                  ...p,
                  product_rating: avg,
                  product_total_vote: feedbacks.length,
                };
              }
            } catch (err) {
              console.error(
                `Error fetching feedback for product ${p._id}:`,
                err
              );
            }

            return { ...p, product_rating: 0, product_total_vote: 0 };
          })
        );

        setProducts(updatedProducts);
      } catch (err) {
        console.error("Error fetching all product feedbacks:", err);
      }
    };

    fetchAllProductFeedbacks();
  }, [products.length]);

  const toggleStatus = async () => {
    const newStatus = !isOpen;
    setIsOpen(newStatus);
    try {
      await axios.put(
        `${import.meta.env.VITE_BE_URL}/api/business/${business._id}`,
        { business_status: newStatus },
        { headers: { "Content-Type": "application/json" } }
      );
      setBusiness((prev) => ({ ...prev, business_status: newStatus }));
    } catch (err) {
      console.error("Error updating business_status:", err);
      setError(`Không thể cập nhật trạng thái. Chi tiết: ${err.message}`);
      setIsOpen(!newStatus);
    }
  };

  const handleEdit = (field) => {
    setEditFields({ ...editFields, [field]: true });
    setEditedValues({ ...editedValues, [field]: business[field] || "" });
  };

  const handleChange = (e, field) => {
    setEditedValues({ ...editedValues, [field]: e.target.value });
  };

  const handleBlur = async (field, businessId) => {
    const newValue = editedValues[field];

    if (field === "business_phone" && newValue) {
      const phoneRegex = /^0\d{9}$/;
      if (!phoneRegex.test(newValue)) {
        toast.error(
          "Số điện thoại không hợp lệ. Phải là 10 số, bắt đầu bằng 0."
        );
        setEditedValues((prev) => ({
          ...prev,
          [field]: business[field] || "",
        }));
        setEditFields((prev) => ({ ...prev, [field]: false }));
        return;
      }
    }

    if (field === "business_name" && newValue && newValue.trim().length > 100) {
      toast.error("Tên doanh nghiệp không được vượt quá 100 ký tự.");
      setEditedValues((prev) => ({
        ...prev,
        [field]: business[field] || "",
      }));
      setEditFields((prev) => ({ ...prev, [field]: false }));
      return;
    }

    if (
      field === "business_detail" &&
      newValue &&
      newValue.trim().length > 1000
    ) {
      toast.error("Mô tả doanh nghiệp không được vượt quá 1000 ký tự.");
      setEditedValues((prev) => ({
        ...prev,
        [field]: business[field] || "",
      }));
      setEditFields((prev) => ({ ...prev, [field]: false }));
      return;
    }

    const isSame =
      field === "business_category_id"
        ? newValue === business.business_category_id?._id
        : newValue === business[field];

    if (isSame) {
      setEditFields((prev) => ({ ...prev, [field]: false }));
      return;
    }

    try {
      const payload =
        field === "business_category_id"
          ? { business_category_id: newValue?._id || newValue }
          : { [field]: newValue };
      await axios.put(
        `${import.meta.env.VITE_BE_URL}/api/business/${businessId}`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      if (field === "business_category_id") {
        const updatedCategory = categories.find(
          (c) => c._id === (newValue?._id || newValue)
        );
        setBusiness((prev) => ({
          ...prev,
          business_category_id: updatedCategory || { _id: newValue },
        }));
      } else {
        setBusiness((prev) => ({ ...prev, [field]: newValue }));
      }
    } catch (err) {
      console.error(`Error updating ${field}:`, err);
      setError(`Không thể cập nhật ${field}. Chi tiết: ${err.message}`);
    } finally {
      setEditFields((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handleAddImage = async (event) => {
    const files = Array.from(event.target.files);

    if (files.length === 0) return;

    const toastId = toast.loading("Đang tải ảnh lên...");

    try {
      const uploadedUrls = await uploadToCloudinary(files);
      setNewImages((prev) => [...prev, ...uploadedUrls]);
      setError(null);
      toast.update(toastId, {
        render: "Tải ảnh lên thành công! Nhấn 'Lưu ảnh' bên dưới.",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      toast.update(toastId, {
        render: "Không thể tải ảnh lên Cloudinary",
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSaveImages = async () => {
    if (newImages.length > 0 && business) {
      const toastId = toast.loading("Đang lưu ảnh...");
      try {
        const updatedImages = [
          ...(business.business_image || []),
          ...newImages,
        ];

        await axios.put(
          `${import.meta.env.VITE_BE_URL}/api/business/${business._id}`,
          { business_image: updatedImages },
          { headers: { "Content-Type": "application/json" } }
        );

        setBusiness((prev) => ({ ...prev, business_image: updatedImages }));
        setNewImages([]);
        toast.update(toastId, {
          render: "Lưu ảnh thành công!",
          type: "success",
          isLoading: false,
          autoClose: 3000,
        });
      } catch (err) {
        console.error("Error saving images:", err);
        setError("Không thể lưu ảnh. Vui lòng kiểm tra kết nối.");
        toast.update(toastId, {
          render: "Không thể lưu ảnh. Vui lòng thử lại.",
          type: "error",
          isLoading: false,
          autoClose: 5000,
        });
      }
    }
  };

  const handleDeleteImage = (index) => {
    const allImages = [...(business.business_image || []), ...newImages];
    if (allImages.length === 1) {
      toast.warning("Bạn phải giữ lại ít nhất một ảnh.");
      return;
    }
    setImageIndexToDelete(index);
    setIsDeleteModalOpen(true);
  };
  const executeDeleteImage = async () => {
    if (imageIndexToDelete === null) return;
    const index = imageIndexToDelete;
    const allImages = [...(business.business_image || []), ...newImages];
    setIsDeleteModalOpen(false);
    const toastId = toast.loading("Đang xóa ảnh...");
    try {
      const updatedImages = allImages.filter((_, i) => i !== index);
      await axios.put(
        `${import.meta.env.VITE_BE_URL}/api/business/${business._id}`,
        { business_image: updatedImages },
        { headers: { "Content-Type": "application/json" } }
      );
      setBusiness((prev) => ({
        ...prev,
        business_image: updatedImages.filter(
          (_, i) => !newImages.includes(allImages[i])
        ),
      }));
      setNewImages((prev) =>
        prev.filter((_, i) => allImages[index] !== prev[i])
      );
      if (index === selectedImage) {
        setSelectedImage(0);
      } else if (index < selectedImage) {
        setSelectedImage((prev) => prev - 1);
      }
      toast.update(toastId, {
        render: "Xóa ảnh thành công!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (err) {
      console.error("Error deleting image:", err);
      toast.update(toastId, {
        render: "Không thể xóa ảnh. Vui lòng thử lại.",
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setImageIndexToDelete(null);
    }
  };

  const handleViewDetails = (id) => {
    const product = products.find((p) => p._id === id);
    if (product) {
      const transformedProduct = {
        id: product._id,
        name: product.product_name,
        price: product.product_price || "0",
        rating: product.product_rating || 0,
        reviews: `${product.product_total_vote || 0} Đánh giá`,
        mainImage: product.product_image?.[0] || "1.png",
        thumbnails: product.product_image || ["1.png", "2.png", "3.png"],
        description: product.product_description || "Không có mô tả",
        isSaved: true,
      };
      setSelectedProduct(transformedProduct);
      setShowModal(true);
    }
  };

  const executeDeleteProduct = async () => {
    if (!productIdToDelete) return;

    setIsProductDeleteModalOpen(false);
    const toastId = toast.loading("Đang xóa sản phẩm...");

    try {
      await axios.delete(
        `${import.meta.env.VITE_BE_URL}/api/product/${productIdToDelete}`
      );

      setProducts((prevProducts) =>
        prevProducts.filter((p) => p._id !== productIdToDelete)
      );

      toast.update(toastId, {
        render: "Xóa sản phẩm thành công!",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (err) {
      console.error("Error deleting product:", err);
      toast.update(toastId, {
        render: `Không thể xóa sản phẩm. Lỗi: ${
          err.response?.data?.message || err.message
        }`,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setProductIdToDelete(null);
    }
  };

  const handleDeleteProduct = (productId) => {
    setProductIdToDelete(productId);
    setIsProductDeleteModalOpen(true);
  };

  const renderStars = (rating) =>
    "★".repeat(Math.floor(rating)) + "☆".repeat(5 - Math.floor(rating));

  const displayedProducts = isExpanded ? products : products.slice(0, 6);

  const handleKeyDown = (e, field) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleBlur(field);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <LoadingScreen />
      </>
    );
  }

  if (error || !business) {
    return (
      <>
        <Header />
        <LoadingScreen />
      </>
    );
  }

  const allImages = [...(business.business_image || []), ...newImages];

  return (
    <>
      <Header />
      <section className="business-detail-section">
        <div className="business-detail">
          <div className="business-detail-container">
            <button className="back-button" onClick={() => navigate(-1)}>
              <span className="back-icon">←</span> Quay Lại
            </button>
            {planExpired && (
              <div className="business-warning">
                <button
                  className="business-detail-reapprove-btn"
                  onClick={() => navigate("/stacks")}
                >
                  Gói doanh nghiệp của bạn đã hết hạn. Vui lòng nhấn vào đây để
                  gia hạn!
                </button>
              </div>
            )}
            {business?.business_active === "pending" && !planExpired && (
              <div className="business-warning">
                Doanh nghiệp của bạn đang trong quá trình xét duyệt bởi quản trị
                viên. <br />
                Vui lòng đợi hoặc liên hệ qua email{" "}
                <b>locallinkhola@gmail.com</b> để được hỗ trợ.
              </div>
            )}
            {business?.business_active === "inactive" && (
              <div className="business-warning">
                <button
                  className="business-detail-reapprove-btn"
                  onClick={async () => {
                    const metadataKey = `reapproveEmailSent_${business._id}`;
                    const now = Date.now();
                    const ONE_DAY = 24 * 60 * 60 * 1000;

                    const toastId = toast.loading(
                      "Đang kiểm tra và gửi email..."
                    );

                    try {
                      const lastSent = user?.unsafeMetadata?.[metadataKey];

                      if (lastSent) {
                        const timePassed = now - parseInt(lastSent, 10);
                        if (timePassed < ONE_DAY) {
                          const hoursLeft = Math.ceil(
                            (ONE_DAY - timePassed) / (60 * 60 * 1000)
                          );
                          toast.update(toastId, {
                            render: `Bạn đã gửi yêu cầu hôm nay. Vui lòng thử lại sau ${hoursLeft} giờ.`,
                            type: "info",
                            isLoading: false,
                            autoClose: 5000,
                          });
                          return;
                        }
                      }

                      const emailParams = {
                        email: import.meta.env.VITE_EMAILJS_ADMIN_EMAIL,
                        business_name: business.business_name,
                      };

                      await sendEmail(
                        import.meta.env.VITE_EMAILJS_TEMPLATE_REAPPROVE_ID,
                        emailParams
                      );

                      await user.update({
                        unsafeMetadata: {
                          ...user.unsafeMetadata,
                          [metadataKey]: now,
                        },
                      });

                      toast.update(toastId, {
                        render: "Yêu cầu đã được gửi đến quản trị viên.",
                        type: "success",
                        isLoading: false,
                        autoClose: 5000,
                      });
                    } catch (error) {
                      console.error("Metadata or email error:", error);
                      toast.update(toastId, {
                        render: "Không thể gửi email. Vui lòng thử lại sau.",
                        type: "error",
                        isLoading: false,
                        autoClose: 7000,
                      });
                    }
                  }}
                >
                  Doanh nghiệp này chưa được phê duyệt. Bấm vào đây để gửi email
                  đến quản trị viên.
                </button>
              </div>
            )}
            <div className="business-content">
              <div className="business-images">
                <div className="main-image">
                  <img
                    src={allImages[selectedImage] || "1.png"}
                    alt={`${business.business_name} main ${selectedImage + 1}`}
                    className="main-img"
                    onError={(e) => (e.target.src = "1.png")}
                  />
                </div>
                <div className="thumbnail-images">
                  {allImages.map((img, idx) => (
                    <div
                      key={idx}
                      className={`thumbnail ${
                        selectedImage === idx ? "active" : ""
                      }`}
                      style={{ position: "relative", cursor: "pointer" }}
                      onClick={() => setSelectedImage(idx)} // Ensure this handler is working
                    >
                      <img
                        src={img || "1.png"}
                        alt={`${business.business_name} thumbnail ${idx + 1}`}
                        onError={(e) => (e.target.src = "1.png")}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
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
                    </div>
                  ))}
                  <label className="thumbnail add-image">
                    <FaPlus />
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      ref={fileInputRef}
                      onChange={handleAddImage}
                      style={{ display: "none" }}
                    />
                  </label>
                  {newImages.length > 0 && (
                    <button
                      onClick={handleSaveImages}
                      style={{
                        padding: "0.5rem 1rem",
                        background: "#4CAF50",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Lưu ảnh
                    </button>
                  )}
                </div>
              </div>
              <div className="business-info">
                <div className="editable-field">
                  <h1 className="business-title">
                    {editFields["business_name"] ? (
                      <input
                        type="text"
                        value={editedValues["business_name"] || ""}
                        onChange={(e) => handleChange(e, "business_name")}
                        onBlur={() => handleBlur("business_name", business._id)}
                        onKeyDown={(e) => handleKeyDown(e, "business_name")}
                        autoFocus
                        maxLength="100"
                      />
                    ) : (
                      business.business_name
                    )}
                  </h1>
                  {!editFields["business_name"] && (
                    <p
                      className="edit-btn"
                      onClick={() => handleEdit("business_name")}
                    >
                      <LuTextCursorInput />
                    </p>
                  )}
                </div>
                <div className="editable-field">
                  <div className="business-status">
                    <label className="toggle-container">
                      <input
                        type="checkbox"
                        checked={isOpen}
                        onChange={toggleStatus}
                        className="toggle-input"
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    <span
                      className={`status-text ${isOpen ? "open" : "closed"}`}
                    >
                      {isOpen ? "Đang mở cửa" : "Đang đóng cửa"}
                    </span>
                  </div>
                </div>
                <div className="editable-field">
                  <p className="business-description" style={{ width: "100%" }}>
                    {editFields["business_detail"] ? (
                      <textarea
                        value={editedValues["business_detail"] || ""}
                        onChange={(e) => handleChange(e, "business_detail")}
                        onBlur={() =>
                          handleBlur("business_detail", business._id)
                        }
                        onKeyDown={(e) => handleKeyDown(e, "business_detail")}
                        autoFocus
                        maxLength="1000"
                        rows="10"
                        style={{ width: "100%", fontSize: "0.9rem" }}
                      />
                    ) : (
                      business.business_detail || "Không có mô tả"
                    )}
                  </p>
                  {!editFields["business_detail"] && (
                    <p
                      className="edit-btn"
                      onClick={() => handleEdit("business_detail")}
                    >
                      <LuTextCursorInput />
                    </p>
                  )}
                </div>
                <p className="business-category">Đánh giá của người dùng</p>
                <div className="rating-section">
                  <div className="stars">{renderStars(overallRating)}</div>
                  <span className="rating-count">{totalReviews}</span>

                  <div
                    className="toggle-container"
                    style={{ marginLeft: "1rem" }}
                  >
                    <label
                      className="toggle-container"
                      style={{ marginLeft: "1rem" }}
                    >
                      <input
                        type="checkbox"
                        checked={showActiveOnly}
                        onChange={() => setShowActiveOnly((prev) => !prev)}
                        className="toggle-input"
                        id="activeFilterSwitch"
                      />
                      <span className="toggle-slider"></span>
                      <span className="status-text">
                        {showActiveOnly
                          ? "Chỉ đánh giá hoạt động"
                          : "Tất cả đánh giá"}
                      </span>
                    </label>
                  </div>
                </div>
                <div className="contact-info">
                  <h3 className="contact-title">Thông tin liên hệ</h3>
                  <div className="editable-field">
                    <p className="contact-detail">
                      <strong>Số điện thoại:</strong>{" "}
                      {editFields["business_phone"] ? (
                        <input
                          type="tel"
                          maxLength="10"
                          value={editedValues["business_phone"] || ""}
                          onChange={(e) => {
                            const numericValue = e.target.value.replace(
                              /[^0-9]/g,
                              ""
                            );
                            const finalValue = numericValue.slice(0, 10);

                            const syntheticEvent = {
                              target: { value: finalValue },
                            };
                            handleChange(syntheticEvent, "business_phone");
                          }}
                          onBlur={() =>
                            handleBlur("business_phone", business._id)
                          }
                          onKeyDown={(e) => handleKeyDown(e, "business_phone")}
                          autoFocus
                        />
                      ) : (
                        business.business_phone || "..."
                      )}
                    </p>
                    {!editFields["business_phone"] && (
                      <p
                        className="edit-btn"
                        onClick={() => handleEdit("business_phone")}
                      >
                        <LuTextCursorInput />
                      </p>
                    )}
                  </div>
                  <div className="editable-field">
                    <p className="contact-detail">
                      <strong>Địa chỉ:</strong>{" "}
                      {editFields["business_address"] ? (
                        <input
                          type="text"
                          value={editedValues["business_address"] || ""}
                          onChange={(e) => handleChange(e, "business_address")}
                          onBlur={() =>
                            handleBlur("business_address", business._id)
                          }
                          onKeyDown={(e) =>
                            handleKeyDown(e, "business_address")
                          }
                          autoFocus
                        />
                      ) : (
                        business.business_address || "..."
                      )}
                    </p>

                    {!editFields["business_address"] && (
                      <div className="edit-btn-group">
                        <p
                          className="edit-btn"
                          onClick={() => setIsMapOpen(true)}
                          title="Cập nhật từ bản đồ"
                        >
                          <LuTextCursorInput />
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="editable-field">
                    <p className="contact-detail">
                      <strong>Mô hình kinh doanh:</strong>{" "}
                      {editFields["business_category_id"] ? (
                        <select
                          style={{ fontSize: "16px" }}
                          value={
                            editedValues["business_category_id"] ||
                            business.business_category_id?._id
                          }
                          onChange={(e) =>
                            setEditedValues({
                              ...editedValues,
                              business_category_id: e.target.value,
                            })
                          }
                          onBlur={() =>
                            handleBlur("business_category_id", business._id)
                          }
                        >
                          <option value="">
                            -- Hãy chọn mô hình kinh doanh --
                          </option>
                          {categories.map((cat) => (
                            <option
                              key={cat._id}
                              value={cat._id}
                              style={{ textTransform: "capitalize" }}
                            >
                              {cat.category_name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ textTransform: "capitalize" }}>
                          {business.business_category_id?.category_name ||
                            "..."}
                        </span>
                      )}
                    </p>
                    {!editFields["business_category_id"] && (
                      <div className="edit-btn-group">
                        <p
                          className="edit-btn"
                          onClick={() => handleEdit("business_category_id")}
                        >
                          <LuTextCursorInput />{" "}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="business-products-section">
        <div className="business-products">
          <div className="products-container">
            <h2 className="products-title">Sản phẩm kinh doanh</h2>
            <div className="products-list">
              {displayedProducts.map((product) => (
                <div key={product._id} className="product-card">
                  <div className="product-images">
                    <div className="product-main-image">
                      <img
                        src={product.product_image?.[0] || "1.png"}
                        alt={product.product_name}
                      />
                    </div>
                  </div>
                  <div className="product-info">
                    <h3 className="product-name">{product.product_name}</h3>
                    <div className="product-price">
                      {product.product_price || "0"}
                    </div>
                    <div className="product-rating">
                      <div className="stars">
                        {renderStars(product.product_rating || 0)}
                      </div>
                      <span className="reviews-count">
                        {product.product_total_vote || "0"} Đánh giá
                      </span>
                    </div>
                    <p
                      className="view-details-btn"
                      onClick={() => handleViewDetails(product._id)}
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: "10px",
                      }}
                    >
                      <FaEye /> Xem sản phẩm
                    </p>
                    <p
                      className="delete-product-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProduct(product._id);
                      }}
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: "10px",
                      }}
                    >
                      <FaTrash /> Xóa sản phẩm
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="product-actions">
              {products.length >= 3 && (
                <button
                  className="expand-btn"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? "Thu gọn" : "Mở rộng"}
                </button>
              )}
              <a href="/product-registration" className="add-product-btn">
                Thêm sản phẩm
              </a>
            </div>
          </div>
        </div>
      </section>

      <MyBusinessFeedback businessId={business?._id} canDelete={true} />
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

            setEditedValues((prev) => ({
              ...prev,
              business_address: newAddress,
            }));

            setBusiness((prev) => ({
              ...prev,
              business_address: newAddress,
              business_location: {
                type: "Point",
                coordinates: [lng, lat],
              },
            }));

            await axios.put(
              `${import.meta.env.VITE_BE_URL}/api/business/${business._id}`,
              {
                business_address: newAddress,
                business_location: {
                  type: "Point",
                  coordinates: [lng, lat],
                },
              }
            );

            toast.update(toastId, {
              render: "Lấy địa chỉ thành công!",
              type: "success",
              isLoading: false,
              autoClose: 3000,
            });
            setIsMapOpen(false);
          } catch (error) {
            console.error("Lỗi cập nhật địa chỉ:", error);
            toast.update(toastId, {
              render: "Không thể lấy địa chỉ. Vui lòng thử lại.",
              type: "error",
              isLoading: false,
              autoClose: 3000,
            });
          }
        }}
      />
      <BusinessProductModal
        showModal={showModal}
        setShowModal={setShowModal}
        selectedProduct={selectedProduct}
        setSelectedProduct={setSelectedProduct}
        renderStars={renderStars}
        products={products}
        setProducts={setProducts}
        businessId={business?._id}
      />
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div
            className="modal-overlay"
            onClick={() => setIsDeleteModalOpen(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 9999,
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: "#fff",
                padding: "30px",
                borderRadius: "10px",
                maxWidth: "350px",
                width: "90%",
                textAlign: "center",
                boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
              }}
            >
              <h3>Xác nhận xóa</h3>
              <p style={{ margin: "15px 0" }}>
                Bạn có chắc chắn muốn xóa ảnh này không?
              </p>
              <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: "10px 20px",
                    cursor: "pointer",
                    background: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    fontWeight: "bold",
                    transition: "background 0.2s",
                  }}
                  onMouseOver={(e) => (e.target.style.background = "#5a6268")}
                  onMouseOut={(e) => (e.target.style.background = "#6c757d")}
                >
                  Hủy
                </button>
                <button
                  onClick={executeDeleteImage}
                  style={{
                    flex: 1,
                    padding: "10px 20px",
                    cursor: "pointer",
                    background: "#dc3545",
                    color: "white",
                    border: "none",
                    fontWeight: "bold",
                    borderRadius: "5px",
                    transition: "background 0.2s",
                  }}
                  onMouseOver={(e) => (e.target.style.background = "#c82333")}
                  onMouseOut={(e) => (e.target.style.background = "#dc3545")}
                >
                  Xóa
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {" "}
        {isProductDeleteModalOpen && (
          <div
            className="modal-overlay"
            onClick={() => setIsProductDeleteModalOpen(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 9999,
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: "#fff",
                padding: "30px",
                borderRadius: "10px",
                maxWidth: "350px",
                width: "90%",
                textAlign: "center",
                boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
              }}
            >
              <h3>Xác nhận xóa</h3>
              <p style={{ margin: "15px 0", lineHeight: "1.5" }}>
                Bạn có chắc muốn xóa sản phẩm này? <br />
                Hành động này không thể hoàn tác.
              </p>
              <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setIsProductDeleteModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: "10px 20px",
                    cursor: "pointer",
                    background: "#6c757d",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    fontWeight: "bold",
                    transition: "background 0.2s",
                  }}
                  onMouseOver={(e) => (e.target.style.background = "#5a6268")}
                  onMouseOut={(e) => (e.target.style.background = "#6c757d")}
                >
                  Hủy
                </button>
                <button
                  onClick={executeDeleteProduct}
                  style={{
                    flex: 1,
                    padding: "10px 20px",
                    cursor: "pointer",
                    background: "#dc3545",
                    color: "white",
                    border: "none",
                    fontWeight: "bold",
                    borderRadius: "5px",
                    transition: "background 0.2s",
                  }}
                  onMouseOver={(e) => (e.target.style.background = "#c82333")}
                  onMouseOut={(e) => (e.target.style.background = "#dc3545")}
                >
                  Xóa
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <Footer />
    </>
  );
};

export default MyBusinessPage;
