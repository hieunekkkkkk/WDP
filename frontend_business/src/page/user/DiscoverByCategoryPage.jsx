import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import HeroSection from "../../components/HeroSection";
import FilterSidebar from "../../components/FilterSidebar";
import LoadingScreen from "../../components/LoadingScreen";
import { AnimatePresence, motion } from "framer-motion";
import "../../css/DiscoverByCategoryPage.css";
import useGeolocation from "../../utils/useGeolocation";
import { PuffLoader } from "react-spinners";

function DiscoverByCategoryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { fetchLocation } = useGeolocation();

  const [categoryId, setCategoryId] = useState(
    location.state?.category_id || null
  );
  const [categoryName, setCategoryName] = useState(
    location.state?.category_name || null
  );

  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    distance: 50,
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

  // Navigate back if no category
  useEffect(() => {
    if (!categoryId) {
      navigate("/discover");
    }
  }, [categoryId, navigate]);

  // Fetch businesses by distance and category
  useEffect(() => {
    const fetchBusinesses = async () => {
      if (!categoryId) return;

      setLoading(true);
      setError(null);

      try {
        const storedLocation = JSON.parse(localStorage.getItem("userLocation"));
        if (!storedLocation?.latitude || !storedLocation?.longitude) {
          throw new Error(
            "Vui lòng bật quyền truy cập vị trí trong trình duyệt hoặc thiết bị để tiếp tục."
          );
        }

        const { latitude, longitude } = storedLocation;

        const response = await axios.get(
          `${import.meta.env.VITE_BE_URL}/api/business/near`,
          {
            params: {
              latitude,
              longitude,
              maxDistance: filters.distance * 1000,
              categoryId: categoryId,
            },
            timeout: 10000,
          }
        );

        if (Array.isArray(response.data)) {
          const filtered = response.data.filter(
            (b) => b.business_active === "active"
          );

          // 🔹 Fetch live ratings for each business
          const enriched = await Promise.all(
            filtered.map(async (b) => {
              let avgRating = 0;

              try {
                const res = await axios.get(
                  `${import.meta.env.VITE_BE_URL}/api/feedback/business/${
                    b._id
                  }`
                );

                if (res.data?.success && Array.isArray(res.data.data)) {
                  const feedbacks = res.data.data;
                  const total = feedbacks.reduce(
                    (sum, fb) => sum + (fb.feedback_rating || 0),
                    0
                  );
                  avgRating =
                    feedbacks.length > 0 ? total / feedbacks.length : 0;
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
                rating: avgRating, // ✅ Use real rating
                status: b.business_status ? "Đang mở cửa" : "Đã đóng cửa",
              };
            })
          );

          setBusinesses(enriched);
        } else {
          throw new Error(
            `Unexpected response format: ${JSON.stringify(response.data)}`
          );
        }
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
  }, [categoryId, filters.distance]);

  // Local filtering for price and rating
  const filteredBusinesses = businesses.filter((b) => {
    const { price, rating, status } = b;

    const { cheapest, mostExpensive, opening, closed } = filters.price;
    const { lowest, highest, fourStars, fiveStars } = filters.rating;

    let pricePass =
      (!cheapest || price <= 50000) &&
      (!mostExpensive || price >= 50000) &&
      (!opening || status === "Đang mở cửa") &&
      (!closed || status === "Đã đóng cửa");

    let ratingPass =
      (!lowest || rating <= 2) &&
      (!highest || rating >= 4) &&
      (!fourStars || rating == 4) &&
      (!fiveStars || rating == 5);

    return pricePass && ratingPass;
  });

  const handleFilterChange = (type, value) => {
    setFilters((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  if (loading) {
    return (
      <>
        <Header />
        <HeroSection />
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
      <HeroSection />

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
                      <p style={{flex: 1}}>{b.business_address}</p>
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
