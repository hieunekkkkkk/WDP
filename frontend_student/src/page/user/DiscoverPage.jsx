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

function DiscoverPage() {
  const [categories, setCategories] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentServicePage, setCurrentServicePage] = useState(0);
  const [direction, setDirection] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get("query") || "";
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

      setCategories(catRes.data.categories || []);
      setBusinesses(activeBusinesses || []);
    } catch (err) {
      console.error("Fetch failed:", err);
      setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
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
      <HeroSection />
      <div className="landing-page-new">
        <div className="container">
          {/* Best Places Section - ĐỘNG từ bestBusinesses API */}
          <section className="best-places-section">
            <h2>Best of HOLA</h2>

            <div className="places-grid-new">
              {businesses.slice(0, 8).map((business) => (
                <PlaceCard
                  key={business._id}
                  business={business}
                  onClick={handleBusinessClick}
                />
              ))}
            </div>
          </section>

          {/* Services Section - ĐỘNG từ categories API */}
          <section className="services-section-new">
            <h2>Danh mục dịch vụ</h2>
            <div
              className="services-container"
              style={{
                position: "relative",
                maxWidth: "1200px",
                margin: "0 auto",
              }}
            >
              {showServiceNav && (
                <button
                  className="service-nav-btn prev-btn"
                  aria-label="Xem danh mục trước"
                >
                  ←
                </button>
              )}

              <div className="services-grid-new">
                {categories.length > 0 ? (
                  categories.map((category, index) => (
                    <ServiceCard
                      key={category._id}
                      category={category}
                      businesses={businesses}
                      index={index}
                      onSeeMore={handleSeeMore}
                    />
                  ))
                ) : (
                  <div
                    style={{
                      gridColumn: "1 / -1",
                      textAlign: "center",
                      padding: "2rem",
                      color: "#666",
                    }}
                  >
                    <p>Chưa có danh mục nào</p>
                  </div>
                )}
              </div>

              {showServiceNav && (
                <button
                  className="service-nav-btn next-btn"
                  onClick={handleNextService}
                  aria-label="Xem danh mục tiếp theo"
                >
                  →
                </button>
              )}

              {/* Dots indicator - ĐỘNG theo số categories */}
              {showServiceNav && (
                <div className="service-dots-container">
                  {Array.from({ length: Math.ceil(categories.length / 4) }).map(
                    (_, idx) => (
                      <button
                        key={idx}
                        className={`service-dot ${
                          currentServicePage === idx ? "active" : ""
                        }`}
                        onClick={() => setCurrentServicePage(idx)}
                      />
                    )
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
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
