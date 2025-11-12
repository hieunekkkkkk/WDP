import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PuffLoader } from "react-spinners";

function PersonalizedPage() {
  const [type, setType] = useState("Coffee");
  const [budget, setBudget] = useState("50,000");
  const [customBudget, setCustomBudget] = useState("");
  const [rating, setRating] = useState(5);
  const [bestPlaces, setBestPlaces] = useState([]);
  const [userMessage, setUserMessage] = useState("");
  const [categories, setCategories] = useState([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_BE_URL}/api/category`);
        const data = await res.json();
        setCategories(data.categories);
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const handleSendMessage = async () => {
    if (!userMessage.trim()) return;

    const formattedText = `${userMessage}`;

    try {
      setIsLoadingPlaces(true);
      const res = await fetch(
        `${import.meta.env.VITE_BE_URL}/api/ai/recommend`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: formattedText }),
        }
      );

      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        const openBusinesses = data.filter(
          (place) => place.business_status === true
        );
        setBestPlaces(openBusinesses.slice(0, 6));
      } else {
        setBestPlaces([]);
      }
    } catch (error) {
      console.error("Failed to get AI recommendations:", error);
      setBestPlaces([]);
    } finally {
      setIsLoadingPlaces(false);
    }

    setUserMessage("");
  };

  return (
    <>
      <div className="personalized-page">
        {/* Search Section */}
        <div className="personalized-search-section">
          {/* Filter Section */}
          <div className="personalized-filter-container">
            <h2 className="personalized-search-title">
              Trở lãi ở giúp tìm kiếm theo yêu cầu của bạn!
            </h2>
            <p className="personalized-search-subtitle">
              Giúp tìm kiếm theo nhu cầu của cá nhân hóa, thêm vào danh sách yêu
              thích để chia.
            </p>
            <p className="personalized-filter-info">
              <span className="personalized-filter-label">
                Tiêu chí của bạn:
              </span>{" "}
              Lựa chọn tiêu chí giúp trở lý AI đưa ra lựa chọn phù hợp nhất cho
              bạn!
            </p>

            {/* Type Filter */}
            <div className="personalized-chat-filter">
              <div className="personalized-chat-filter-detail">
                <div className="personalized-filter-group">
                  <label className="personalized-filter-label">
                    Loại doanh nghiệp:
                  </label>
                  <div className="personalized-filter-options">
                    {categories.map((category) => (
                      <button
                        key={category._id}
                        onClick={() => setType(category.category_name)}
                        className={`personalized-filter-button ${
                          type === category.category_name
                            ? "personalized-active"
                            : ""
                        }`}
                      >
                        {category.category_name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Budget Filter */}
                <div className="personalized-filter-group">
                  <label className="personalized-filter-label">
                    Giới hạn số tiền:
                  </label>
                  <div className="personalized-filter-options">
                    {[
                      "50,000",
                      "100,000",
                      "500,000",
                      "1,500,000",
                      "Tự chọn...",
                    ].map((option) => (
                      <button
                        key={option}
                        onClick={() => setBudget(option)}
                        className={`personalized-filter-button ${
                          budget === option ? "personalized-active" : ""
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                  {budget === "Tự chọn..." && (
                    <div className="personalized-custom-budget-input">
                      <input
                        type="text"
                        placeholder="Nhập số tiền của bạn"
                        value={customBudget}
                        onChange={(e) => setCustomBudget(e.target.value)}
                        className="personalized-input-field"
                      />
                    </div>
                  )}
                </div>

                {/* Rating Filter */}
                <div className="personalized-filter-group">
                  <label className="personalized-filter-label">
                    Đánh giá:{" "}
                    <span className="personalized-rating-label">
                      {rating} sao
                    </span>
                  </label>
                  <div className="personalized-rating-options">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`personalized-star-rating ${
                          star <= rating ? "personalized-active" : ""
                        }`}
                        onClick={() => setRating(star)}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="personalized-chat-box">
                <textarea
                  id="userMessage"
                  className="personalized-textarea-full"
                  placeholder="Hãy mô tả yêu cầu của bạn..."
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                ></textarea>
              </div>
            </div>
            <button
              className="personalized-send-button"
              onClick={handleSendMessage}
              disabled={!userMessage.trim()}
            >
              Gửi yêu cầu
            </button>
          </div>
        </div>

        {/* Best Places Section */}
        <section className="personalized-best-places-section">
          <div className="container">
            <h2>Địa điểm gợi ý</h2>

            {isLoadingPlaces ? (
              <div
                className="loader-container"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: "2rem",
                  height: "12rem",
                }}
              >
                <PuffLoader size={60} />
              </div>
            ) : bestPlaces.length > 0 ? (
              <div className="discover-places-grid">
                {bestPlaces.map((place) => (
                  <div
                    key={place.business_id}
                    className="discover-place-card"
                    onClick={() => navigate(`/business/${place.business_id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="discover-place-image">
                      <img
                        src={place.business_image?.[0] || "/placeholder.jpg"}
                        alt={place.business_name}
                        loading="lazy"
                        onError={(e) => {
                          e.target.src = "/1.png";
                        }}
                      />
                    </div>
                    <div className="discover-place-info">
                      <h3>{place.business_name}</h3>
                      <p className="discover-place-location">
                        {place.business_address}
                      </p>
                      <div className="discover-place-meta">
                        <span
                          className={`discover-status ${
                            place.business_status ? "open" : "closed"
                          }`}
                        >
                          {place.business_status
                            ? "Đang mở cửa"
                            : "Đã đóng cửa"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <h4 className="discover-place-none">
                Không có địa điểm nào phù hợp
              </h4>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

export default PersonalizedPage;
