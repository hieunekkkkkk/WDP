import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import HeroSection from "../../components/HeroSection";
import LoadingScreen from "../../components/LoadingScreen";
import "../../css/DiscoverPage.css";
import { FaXmark } from "react-icons/fa6";
import { motion, AnimatePresence } from "framer-motion";
import { FaCoffee } from "react-icons/fa";
import { MdFoodBank } from "react-icons/md";
import { RiHotelLine } from "react-icons/ri";
import { PiPark } from "react-icons/pi";
import { GiMaterialsScience } from "react-icons/gi";
import { PuffLoader } from "react-spinners";

function DiscoverPage() {
  const [categories, setCategories] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingFilter, setLoadingFilter] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [currentServicePage, setCurrentServicePage] = useState(0);
  const [direction, setDirection] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get("query") || "";
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filteredBusinessesByCategory, setFilteredBusinessesByCategory] =
    useState([]);

  const handleNextService = useCallback(() => {
    setDirection(1);
    const totalServicePages = Math.ceil(categories.length / 4);
    setCurrentServicePage((prev) =>
      prev === totalServicePages - 1 ? 0 : prev + 1
    );
  }, [categories.length]);

  useEffect(() => {
    if (query) {
      fetchSearchResults(query);
    } else {
      fetchData();
    }
  }, [query]);

  const fetchSearchResults = async (query) => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${
          import.meta.env.VITE_BE_URL
        }/api/business/search?query=${encodeURIComponent(query)}`
      );

      const filteredBusinesses = res.data.businesses.filter(
        (b) => b.business_active === "active"
      );

      setFilteredBusinesses(filteredBusinesses || []);
      setSearchQuery(query);
      setIsSearching(true);
    } catch (err) {
      console.error("Search failed:", err);
      setError("Không thể tìm kiếm dữ liệu. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catRes, busRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_BE_URL}/api/category`),
        axios.get(`${import.meta.env.VITE_BE_URL}/api/business?limit=20`),
      ]);

      const activeBusinesses = busRes.data.businesses.filter(
        (b) => b.business_active === "active"
      );

      console.log(catRes);

      setCategories(catRes.data.categories || []);
      setBusinesses(activeBusinesses || []);
      setFilteredBusinessesByCategory(activeBusinesses || []);
    } catch (err) {
      console.error("Fetch failed:", err);
      setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinessesByCategory = async (categoryId) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BE_URL}/api/business`
      );
      let activeBusinesses = res.data.businesses.filter(
        (b) => b.business_active === "active"
      );

      if (categoryId !== "all") {
        activeBusinesses = activeBusinesses.filter(
          (b) => b.business_category_id?._id === categoryId
        );
      }

      setFilteredBusinessesByCategory(activeBusinesses);
    } catch (err) {
      console.error("Fetch businesses failed:", err);
      setError("Không thể tải dữ liệu doanh nghiệp. Vui lòng thử lại sau.");
    } finally {
      setLoadingFilter(false);
    }
  };

  const handleSeeMore = (categoryName, categoryId) => {
    const slug = categoryName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, "-");

    navigate(`/discover/${slug}`, {
      state: {
        category_id: categoryId,
        category_name: categoryName,
      },
    });
  };

  const handleBusinessClick = (businessId) => {
    navigate(`/business/${businessId}`);
  };

  const handleCategoryClick = useCallback(
  (categoryId) => {
    const newCategory = categoryId === selectedCategory ? "all" : categoryId;

    setSelectedCategory(newCategory);
    setLoadingFilter(true);
    fetchBusinessesByCategory(newCategory);
  },
  [selectedCategory]
);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim() !== "") {
      navigate(`/discover?query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getCategoryIcon = (iconName, categoryName) => {
    const iconMap = {
      FaCoffee: <FaCoffee />,
      MdFoodBank: <MdFoodBank />,
      RiHotelLine: <RiHotelLine />,
      PiPark: <PiPark />,
      GiMaterialsScience: <GiMaterialsScience />,
      Coffee: <FaCoffee />,
      "Hàng ăn": <MdFoodBank />,
      "Nhà trọ": <RiHotelLine />,
      "Khu vui chơi": <PiPark />,
      "Nguyên vật liệu": <GiMaterialsScience />,
    };

    return iconMap[iconName] || iconMap[categoryName] || <span>📍</span>;
  };

  if (loading) {
    return (
      <>
        <Header />
        <LoadingScreen />
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="error-message">Error: {error}</div>
        <Footer />
      </>
    );
  }

  const showServiceNav = categories.length > 4;

  const ServiceCard = ({ category, businesses, onSeeMore, index }) => {
    const categoryBusinesses = businesses.filter(
      (b) => b.business_category_id?._id === category._id
    );

    const backgroundImages = ["/1.png", "/2.png", "/3.png", "/1.png", "/2.png"];

    const gradients = [
      "linear-gradient(135deg, rgba(255,107,53,0.8) 0%, rgba(255,107,53,0.6) 100%)",
      "linear-gradient(135deg, rgba(103,92,231,0.8) 0%, rgba(103,92,231,0.6) 100%)",
      "linear-gradient(135deg, rgba(52,168,83,0.8) 0%, rgba(52,168,83,0.6) 100%)",
      "linear-gradient(135deg, rgba(233,30,99,0.8) 0%, rgba(233,30,99,0.6) 100%)",
    ];

    const handleSeeMore = (e) => {
      e.preventDefault();
      e.stopPropagation();
      onSeeMore(category.category_name, category._id);
    };

    const handleCardClick = (e) => {
      e.preventDefault();
      onSeeMore(category.category_name, category._id);
    };

    return (
      <div
        className="service-card-new"
        onClick={handleCardClick}
        style={{ cursor: "pointer" }}
      >
        <div className="service-background">
          <img
            src={backgroundImages[index % backgroundImages.length] || "/1.png"}
            alt={category.category_name}
            loading="lazy"
            onError={(e) => {
              e.target.src = "/1.png";
            }}
          />
          <div
            className="service-gradient"
            style={{ backgroundImage: gradients[index % gradients.length] }}
          ></div>
        </div>
        <div className="service-content-new">
          <h3>{category.category_name}</h3>
          <p>{categoryBusinesses.length} địa điểm</p>
          <button className="service-btn-new" onClick={handleSeeMore}>
            Khám phá →
          </button>
        </div>
      </div>
    );
  };

  const PlaceCard = React.memo(({ business, onClick }) => {
    const businessName = business.business_name || "Tên không có";
    const businessAddress = business.business_address || "Địa chỉ không có";
    const businessRating = business.business_rating || 0;

    const handleClick = useCallback(() => {
      onClick(business._id);
    }, [business._id, onClick]);

    let imageUrl = "/1.png";
    if (
      business.business_image &&
      Array.isArray(business.business_image) &&
      business.business_image.length > 0
    ) {
      imageUrl = business.business_image[0];
    }

    return (
      <div className="place-card-new" onClick={handleClick}>
        <div className="place-image-new">
          <img
            src={imageUrl}
            alt={businessName}
            loading="lazy"
            onError={(e) => {
              e.target.src = "/1.png";
            }}
          />
          <div className="place-overlay">
            <div className="place-info-overlay">
              <h3>{businessName}</h3>
              <p>{businessAddress}</p>
              <div className="rating-overlay">
                ⭐ {businessRating.toFixed(1)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  });

  return (
    <>
      <Header />
      <section className="hero-section-landing">
        <div className="hero-background">
          <img src="/1.png" alt="Mountains" className="hero-bg-image" />
          <div className="hero-overlay"></div>
        </div>
        <div className="hero-content">
          <div className="hero-text">
            <h1>Lựa chọn điểm đến lý tưởng</h1>
            <p>Cùng cập nhật thông tin hữu ích</p>
          </div>

          <div className="search-form">
            <form className="search-box" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Tìm kiếm địa điểm"
                className="hero-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="search-btn">
                Tìm kiếm
              </button>
            </form>
          </div>

          <div className="category-pills">
            <p>Đã đăng theo danh mục</p>
            <div className="pills-container">
              <button
                onClick={() => handleCategoryClick("all")}
                className={`category-pill ${
                  selectedCategory === "all" ? "active" : ""
                }`}
              >
                <span className="pill-icon">🏠</span>
                <span>Tất cả</span>
              </button>
              {categories.map((category) => (
                <button
                  key={category._id}
                  onClick={() => handleCategoryClick(category._id)}
                  className={`category-pill ${
                    selectedCategory === category._id ? "active" : ""
                  }`}
                >
                  <span className="pill-icon">
                    {getCategoryIcon(category.icon, category.category_name)}
                  </span>
                  <span>{category.category_name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
      <div className="landing-page-new">
        {!isSearching && (
          <div className="container">
            {/* Best Places Section - ĐỘNG từ bestBusinesses API */}
            <section className="best-places-section">
              <h2>Best of HOLA</h2>

              {loadingFilter ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "20vh",
                    flexDirection: "column",
                  }}
                >
                  <PuffLoader size={90} />
                  <p
                    style={{
                      marginTop: "16px",
                      fontSize: "18px",
                      color: "#333",
                    }}
                  ></p>
                </div>
              ) : (
                <div className="places-grid-new">
                  {filteredBusinessesByCategory.slice(0, 8).map((business) => (
                    <PlaceCard
                      key={business._id}
                      business={business}
                      onClick={handleBusinessClick}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
      <div className="discover-page">
        <div className="container">
          {searchQuery && (
            <section className="search-results-section">
              <p className="search-heading">
                Kết quả tìm kiếm cho: "{searchQuery}"
                <span
                  className="clear-search-icon"
                  title="Bỏ tìm kiếm"
                  onClick={() => {
                    setSearchQuery("");
                    setFilteredBusinesses([]);
                    setIsSearching(false);
                    navigate("/discover", { replace: true });
                  }}
                >
                  <FaXmark />
                </span>
              </p>
              <div className="discover-places-grid">
                {filteredBusinesses.map((business) => (
                  <div
                    key={business._id}
                    className="discover-place-card"
                    onClick={() => handleBusinessClick(business._id)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="discover-place-image">
                      <img
                        src={business.business_image?.[0] || "/placeholder.jpg"}
                        alt={business.business_name}
                        loading="lazy"
                        onError={(e) => {
                          e.target.src = "/1.png";
                        }}
                      />
                    </div>
                    <div className="discover-place-info">
                      <h3>{business.business_name}</h3>
                      <p className="discover-place-location">
                        {business.business_address}
                      </p>
                      <div className="discover-place-meta">
                        <span
                          className={`discover-status ${
                            business.business_status ? "open" : "closed"
                          }`}
                        >
                          {business.business_status
                            ? "Đang mở cửa"
                            : "Đã đóng cửa"}
                        </span>
                        <span className="discover-rating">
                          ⭐ {business.business_rating || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {!searchQuery &&
            categories.map((cat) => (
              <section key={cat._id} className="discover-recommended-section">
                <h2 className="discover-recommended-title">
                  {cat.category_name}
                </h2>
                <div className="discover-places-grid">
                  {businesses
                    .filter((b) => b.business_category_id?._id === cat._id)
                    .slice(0, 3)
                    .map((business) => (
                      <div
                        key={business._id}
                        className="discover-place-card"
                        onClick={() => handleBusinessClick(business._id)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="discover-place-image">
                          <img
                            src={
                              business.business_image?.[0] || "/placeholder.jpg"
                            }
                            alt={business.business_name}
                            loading="lazy"
                            onError={(e) => {
                              e.target.src = "/1.png";
                            }}
                          />
                        </div>
                        <div className="discover-place-info">
                          <h3>{business.business_name}</h3>
                          <p className="discover-place-location">
                            {business.business_address}
                          </p>
                          <div className="discover-place-meta">
                            <span
                              className={`discover-status ${
                                business.business_status ? "open" : "closed"
                              }`}
                            >
                              {business.business_status
                                ? "Đang mở cửa"
                                : "Đã đóng cửa"}
                            </span>
                            <span className="discover-rating">
                              ⭐ {business.business_rating || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
                <div className="see-more-container">
                  <button
                    className="see-more-btn"
                    onClick={() => handleSeeMore(cat.category_name, cat._id)}
                  >
                    Xem thêm
                  </button>
                </div>
              </section>
            ))}

          {!searchQuery && categories.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px 20px" }}>
              <h2 style={{ color: "#666", marginBottom: "20px" }}>
                Chưa có danh mục nào
              </h2>
              <p style={{ color: "#999" }}>
                Vui lòng quay lại sau để khám phá các địa điểm thú vị!
              </p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}

export default DiscoverPage;
