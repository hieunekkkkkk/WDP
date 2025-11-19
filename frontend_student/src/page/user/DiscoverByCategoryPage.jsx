import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import FilterSidebar from "../../components/FilterSidebar";
import { AnimatePresence, motion } from "framer-motion";
import "../../css/DiscoverByCategoryPage.css";
import useGeolocation from "../../utils/useGeolocation";
import { PuffLoader } from "react-spinners";
import { LuUtensils } from "react-icons/lu";
import { FiCoffee } from "react-icons/fi";
import { IoGameControllerOutline } from "react-icons/io5";
import { LuShoppingBag } from "react-icons/lu";
import { FaDumbbell } from "react-icons/fa6";
import { PiStudent } from "react-icons/pi";
import { FaHouse } from "react-icons/fa6";

function DiscoverByCategoryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { fetchLocation } = useGeolocation();

  const [searchQuery, setSearchQuery] = useState("");

  const [categoryId, setCategoryId] = useState(
    location.state?.category_id || null
  );
  const [categoryName, setCategoryName] = useState(
    location.state?.category_name || null
  );

  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(categoryId);

  const [filters, setFilters] = useState({
    distance: 50,
    searchByLocation: true,
    price: {
      cheapest: false,
      mostExpensive: false,
      opening: false,
      closed: false,
    },
    rating: {
      lowest: false,
      highest: false,
      fourStars: false,
      fiveStars: false,
    },
  });

  useEffect(() => {
    if (!categoryId) {
      navigate("/discover");
    }
    setSelectedCategory(categoryId);
  }, [categoryId, navigate]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const catRes = await axios.get(
          `${import.meta.env.VITE_BE_URL}/api/category`
        );
        setCategories(catRes.data.categories || []);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchBusinesses = async () => {
      if (!categoryId) return;

      setLoading(true);
      setError(null);

      try {
        let response;
        let businessList = [];

        if (filters.searchByLocation) {
          const storedLocation = JSON.parse(
            localStorage.getItem("userLocation")
          );
          if (!storedLocation?.latitude || !storedLocation?.longitude) {
            throw new Error(
              "Vui lòng bật quyền truy cập vị trí trong trình duyệt hoặc thiết bị để tiếp tục."
            );
          }

          const { latitude, longitude } = storedLocation;
          const maxDistanceValue = filters.distance * 1000;

          response = await axios.get(
            `${import.meta.env.VITE_BE_URL}/api/business/near`,
            {
              params: {
                latitude,
                longitude,
                maxDistance: maxDistanceValue,
                categoryId: categoryId,
              },
              timeout: 10000,
            }
          );

          if (Array.isArray(response.data)) {
            businessList = response.data;
          } else {
            throw new Error(
              `Unexpected response format from /near: ${JSON.stringify(
                response.data
              )}`
            );
          }
        } else {
          response = await axios.get(
            `${import.meta.env.VITE_BE_URL}/api/business/category/${categoryId}`,
            { timeout: 10000 }
          );

          if (response.data && Array.isArray(response.data.businesses)) {
            businessList = response.data.businesses;
          } else if (Array.isArray(response.data)) {
            businessList = response.data;
          } else {
            throw new Error(
              `Unexpected response format from /category/${categoryId}: ${JSON.stringify(
                response.data
              )}`
            );
          }
        }

        const filtered = businessList.filter(
          (b) => b.business_active === "active"
        );

        const enriched = await Promise.all(
          filtered.map(async (b) => {
            let avgRating = 0;

            try {
              const res = await axios.get(
                `${import.meta.env.VITE_BE_URL}/api/feedback/business/${b._id}`
              );

              if (res.data?.success && Array.isArray(res.data.data)) {
                const feedbacks = res.data.data;
                const total = feedbacks.reduce(
                  (sum, fb) => sum + (fb.feedback_rating || 0),
                  0
                );
                avgRating = feedbacks.length > 0 ? total / feedbacks.length : 0;
              }
            } catch (err) {
              console.error(
                `Error fetching feedback for ${b.business_name}:`,
                err
              );
            }

            return {
              ...b,
              price: b.business_stack_id?.stack_price
                ? parseFloat(b.business_stack_id.stack_price)
                : 50000,
              rating: avgRating,
              status: b.business_status ? "Đang mở cửa" : "Đã đóng cửa",
            };
          })
        );

        setBusinesses(enriched);
      } catch (err) {
        console.error(
          "Fetch error:",
          err.response ? err.response.data : err.message
        );
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinesses();
  }, [categoryId, filters.distance, filters.searchByLocation]);

  const filteredBusinesses = businesses.filter((b) => {
    const { price, rating, status } = b;

    const { cheapest, mostExpensive, opening, closed } = filters.price;
    const { lowest, highest, fourStars, fiveStars } = filters.rating;

    let pricePass = true;
    const priceFiltersActive = cheapest || mostExpensive;
    if (priceFiltersActive) {
      pricePass =
        (cheapest && price <= 50000) || (mostExpensive && price >= 50000);
    }

    let statusPass = true;
    const statusFiltersActive = opening || closed;
    if (statusFiltersActive) {
      statusPass =
        (opening && status === "Đang mở cửa") ||
        (closed && status === "Đã đóng cửa");
    }

    let ratingPass = true;
    const ratingFiltersActive = lowest || highest || fourStars || fiveStars;
    if (ratingFiltersActive) {
      ratingPass =
        (lowest && rating <= 2) ||
        (highest && rating >= 4) ||
        (fourStars && rating >= 4 && rating < 5) ||
        (fiveStars && rating === 5);
    }

    if (!priceFiltersActive && !statusFiltersActive && !ratingFiltersActive) {
      return true;
    }

    return (
      (!priceFiltersActive || pricePass) &&
      (!statusFiltersActive || statusPass) &&
      (!ratingFiltersActive || ratingPass)
    );
  });

  const handleFilterChange = (type, value) => {
    setFilters((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim() !== "") {
      navigate(`/discover?query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSeeMore = (categoryName, categoryId) => {
    if (categoryId === selectedCategory) return;

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

  const handleCategoryClick = (id) => {
    if (id === "all") {
      navigate("/discover");
    }
  };

  const getCategoryIcon = (iconName, categoryName) => {
    const iconMap = {
      LuUtensils: <LuUtensils />,
      FiCoffee: <FiCoffee />,
      IoGameControllerOutline: <IoGameControllerOutline />,
      LuShoppingBag: <LuShoppingBag />,
      FaDumbbell: <FaDumbbell />,
      PiStudent: <PiStudent />,
      FaHouse: <FaHouse />,
    };

    return iconMap[iconName] || iconMap[categoryName] || <span>📍</span>;
  };

  if (loading) {
    return (
      <>
        <Header />
        <section className="hero-section-landing">
          <div className="hero-background">
            <img
              src="https://res.cloudinary.com/diqpghsfm/image/upload/v1762696086/1_ypkvxn.jpg"
              alt="Mountains"
              className="hero-bg-image"
            />
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
                    onClick={() =>
                      handleSeeMore(category.category_name, category._id)
                    }
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
        <div className="discover-by-category-page">
          <FilterSidebar
            filters={filters}
            handleFilterChange={handleFilterChange}
            fetchLocation={fetchLocation}
          />
          <div className="main-content">
            <h1>
              Danh sách{" "}
              <span className="place-header">{categoryName || "..."}</span>
            </h1>
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
                style={{ marginTop: "16px", fontSize: "18px", color: "#333" }}
              ></p>
            </div>
          </div>
        </div>
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

  return (
    <>
      <Header />
      <section className="hero-section-landing">
        <div className="hero-background">
          <img
            src="https://res.cloudinary.com/diqpghsfm/image/upload/v1762696086/1_ypkvxn.jpg"
            alt="Mountains"
            className="hero-bg-image"
          />
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
                  onClick={() =>
                    handleSeeMore(category.category_name, category._id)
                  }
                  className={`category-pill ${
                    selectedCategory === category._id ? "active" : ""
                  }`}
                >
                  <span className="pill-icon">
                    {getCategoryIcon(category.icon, category.category_name)}
                  </span>
                  <span style={{ textTransform: "capitalize" }}>
                    {category.category_name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="discover-by-category-page">
        <FilterSidebar
          filters={filters}
          handleFilterChange={handleFilterChange}
        />

        <div className="main-content">
          <h1>
            Danh sách{" "}
            <span className="place-header">{categoryName || "..."}</span>
          </h1>

          <div className="place-grid">
            {filteredBusinesses.length > 0 ? (
              <AnimatePresence mode="wait">
                {filteredBusinesses.map((b) => (
                  <motion.div
                    key={b._id}
                    className="place-card"
                    onClick={() => navigate(`/business/${b._id}`)}
                    style={{ cursor: "pointer" }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    layout
                  >
                    <div className="place-image">
                      <img src={b.business_image?.[0]} alt={b.business_name} />
                    </div>
                    <div className="place-info">
                      <h3>{b.business_name}</h3>
                      <p style={{ flex: 1 }}>{b.business_address}</p>
                      <div className="place-meta">
                        <span
                          className={`place-status ${
                            b.status === "Đang mở cửa" ? "open" : "close"
                          }`}
                        >
                          {b.status}
                        </span>
                        <span className="place-rating">
                          ⭐ {b.rating?.toFixed(1) || "0.0"}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              <p>Không có địa điểm nào phù hợp.</p>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

export default DiscoverByCategoryPage;
