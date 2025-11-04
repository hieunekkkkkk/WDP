import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import LoadingScreen from '../../components/LoadingScreen';
import DiscoverAISearch from '../../components/DiscoverAISearch';
import '../../css/DiscoverPage.css';
import { FaXmark } from 'react-icons/fa6';
import { PuffLoader } from 'react-spinners';
import { LuUtensils } from 'react-icons/lu';
import { FiCoffee } from 'react-icons/fi';
import { IoGameControllerOutline } from 'react-icons/io5';
import { LuShoppingBag } from 'react-icons/lu';
import { FaDumbbell } from 'react-icons/fa6';
import { PiStudent } from 'react-icons/pi';
import { FaHouse } from 'react-icons/fa6';

function DiscoverPage() {
  const [categories, setCategories] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingFilter, setLoadingFilter] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [currentServicePage, setCurrentServicePage] = useState(0);
  const [direction, setDirection] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get('query') || '';
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredBusinessesByCategory, setFilteredBusinessesByCategory] =
    useState([]);

  const checkAndResetExpiredPriorities = async (businessList) => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const businessesToResetIds = [];

    // Tìm các business cần reset
    businessList.forEach((business) => {
      // Đảm bảo business.updated_at tồn tại trước khi dùng getTime()
      const updatedAtTime = business.updated_at
        ? new Date(business.updated_at).getTime()
        : 0;
      if (business.business_priority > 0 && updatedAtTime < oneHourAgo) {
        businessesToResetIds.push(business._id);
      }
    });

    if (businessesToResetIds.length === 0) {
      return businessList; // Không có gì cần reset
    }

    console.log(
      `[DiscoverPage] Found ${businessesToResetIds.length} businesses to reset priority.`
    );

    // Gọi API reset cho từng business
    const resetPromises = businessesToResetIds.map((id) =>
      axios
        .post(
          `${import.meta.env.VITE_BE_URL}/api/business/${id}/reset-priority`
        )
        .then((response) => ({ id, success: true, data: response.data }))
        .catch((error) => {
          console.error(
            `[DiscoverPage] Failed to reset priority for ${id}:`,
            error.response?.data || error.message
          );
          return { id, success: false };
        })
    );

    // Chờ tất cả API calls hoàn thành
    await Promise.allSettled(resetPromises);

    // Cập nhật trạng thái priority local để UI hiển thị đúng ngay
    const updatedBusinessList = businessList.map((business) => {
      if (businessesToResetIds.includes(business._id)) {
        return {
          ...business,
          business_priority: 0,
          updated_at: new Date().toISOString(),
        };
      }
      return business;
    });

    console.log(
      '[DiscoverPage] Finished attempting resets. Updated list locally.'
    );
    return updatedBusinessList;
  };

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
        (b) => b.business_active === 'active'
      );

      setFilteredBusinesses(filteredBusinesses || []);
      setSearchQuery(query);
      setIsSearching(true);
    } catch (err) {
      console.error('Search failed:', err);
      setError('Không thể tìm kiếm dữ liệu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catRes, busRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_BE_URL}/api/category`),
        axios.get(`${import.meta.env.VITE_BE_URL}/api/business?limit=100`),
      ]);

      let activeBusinesses = busRes.data.businesses.filter(
        (b) => b.business_active === 'active'
      );

      let businessesWithRatings = await Promise.all(
        activeBusinesses.map(async (b) => {
          let rating = 0;
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
              rating = feedbacks.length > 0 ? total / feedbacks.length : 0;
            }
          } catch (err) {
            console.error(
              `Error fetching feedback for ${b.business_name}:`,
              err
            );
          }
          return {
            ...b,
            business_rating: 0,
            business_priority: b.business_priority ?? 0,
            updated_at: b.updated_at ?? new Date(0).toISOString(),
          };
        })
      );

      // Gọi hàm kiểm tra và reset priority, cập nhật lại danh sách local
      businessesWithRatings = await checkAndResetExpiredPriorities(
        businessesWithRatings
      );
      // --- KẾT THÚC DÒNG CODE MỚI ---

      // Sắp xếp danh sách (logic sort gốc của bạn)
      businessesWithRatings.sort((a, b) => {
        // Ưu tiên theo business_priority giảm dần
        if (b.business_priority !== a.business_priority) {
          return b.business_priority - a.business_priority;
        }
        // Nếu priority bằng nhau VÀ > 0, ưu tiên theo updated_at mới nhất
        if (a.business_priority > 0) {
          const dateA = new Date(a.updated_at).getTime();
          const dateB = new Date(b.updated_at).getTime();
          return dateB - dateA;
        }
        // Các trường hợp khác giữ nguyên thứ tự
        return 0;
      });

      setCategories(catRes.data.categories || []);
      setBusinesses(businessesWithRatings);
      setFilteredBusinessesByCategory(businessesWithRatings);
    } catch (err) {
      console.error('Fetch failed:', err);
      setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBusinessesByCategory = async (categoryId) => {
    try {
      setLoadingFilter(true);
      const res = await axios.get(
        `${import.meta.env.VITE_BE_URL}/api/business?limit=100`
      );
      let activeBusinesses = res.data.businesses.filter(
        (b) => b.business_active === 'active'
      );

      if (categoryId !== 'all') {
        activeBusinesses = activeBusinesses.filter(
          (b) => b.business_category_id?._id === categoryId
        );
      }

      // Lấy rating và đảm bảo có priority/updated_at
      let businessesWithRatings = await Promise.all(
        activeBusinesses.map(async (b) => {
          let rating = 0;
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
              rating = feedbacks.length > 0 ? total / feedbacks.length : 0;
            }
          } catch (err) {
            console.error(
              `Error fetching feedback for ${b.business_name}:`,
              err
            );
          }
          return {
            ...b,
            business_rating: 0,
            business_priority: b.business_priority ?? 0,
            updated_at: b.updated_at ?? new Date(0).toISOString(),
          };
        })
      );

      // Gọi hàm kiểm tra và reset priority, cập nhật lại danh sách local
      businessesWithRatings = await checkAndResetExpiredPriorities(
        businessesWithRatings
      );

      // Sắp xếp lại danh sách sau khi đã lọc và reset
      businessesWithRatings.sort((a, b) => {
        if (b.business_priority !== a.business_priority) {
          return b.business_priority - a.business_priority;
        }
        if (a.business_priority > 0) {
          const dateA = new Date(a.updated_at).getTime();
          const dateB = new Date(b.updated_at).getTime();
          return dateB - dateA;
        }
        return 0;
      });

      setFilteredBusinessesByCategory(businessesWithRatings);
    } catch (err) {
      console.error('Fetch businesses failed:', err);
      setError('Không thể tải dữ liệu doanh nghiệp. Vui lòng thử lại sau.');
    } finally {
      setLoadingFilter(false);
    }
  };

  const handleSeeMore = (categoryName, categoryId) => {
    const slug = categoryName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, '-');

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
      const newCategory = categoryId === selectedCategory ? 'all' : categoryId;

      setSelectedCategory(newCategory);
      setLoadingFilter(true);
      fetchBusinessesByCategory(newCategory);
    },
    [selectedCategory]
  );

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim() !== '') {
      navigate(`/discover?query=${encodeURIComponent(searchQuery.trim())}`);
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

    const backgroundImages = ['/1.png', '/2.png', '/3.png', '/1.png', '/2.png'];

    const gradients = [
      'linear-gradient(135deg, rgba(255,107,53,0.8) 0%, rgba(255,107,53,0.6) 100%)',
      'linear-gradient(135deg, rgba(103,92,231,0.8) 0%, rgba(103,92,231,0.6) 100%)',
      'linear-gradient(135deg, rgba(52,168,83,0.8) 0%, rgba(52,168,83,0.6) 100%)',
      'linear-gradient(135deg, rgba(233,30,99,0.8) 0%, rgba(233,30,99,0.6) 100%)',
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
        style={{ cursor: 'pointer' }}
      >
        <div className="service-background">
          <img
            src={backgroundImages[index % backgroundImages.length] || '/1.png'}
            alt={category.category_name}
            loading="lazy"
            onError={(e) => {
              e.target.src = '/1.png';
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
    const businessName = business.business_name || 'Tên không có';
    const businessAddress = business.business_address || 'Địa chỉ không có';
    const businessRating = business.business_rating || 0;

    const handleClick = useCallback(() => {
      onClick(business._id);
    }, [business._id, onClick]);

    let imageUrl = '/1.png';
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
              e.target.src = '/1.png';
            }}
          />
          <div className="place-overlay">
            <div className="place-info-overlay">
              <h3>{businessName}</h3>
              <p>{businessAddress}</p>
              <div className="rating-overlay">
                ⭐{' '}
                {typeof business.business_rating === 'number'
                  ? business.business_rating.toFixed(1)
                  : '0.0'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  });
  PlaceCard.displayName = 'PlaceCard';

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
                onClick={() => handleCategoryClick('all')}
                className={`category-pill ${
                  selectedCategory === 'all' ? 'active' : ''
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
                    selectedCategory === category._id ? 'active' : ''
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
            <section className="best-places-section">
              <h2>Best of HOLA</h2>

              {loadingFilter ? (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '20vh',
                    flexDirection: 'column',
                  }}
                >
                  <PuffLoader size={90} />
                  <p
                    style={{
                      marginTop: '16px',
                      fontSize: '18px',
                      color: '#333',
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
                  {filteredBusinessesByCategory.length === 0 &&
                    !loading &&
                    !loadingFilter && (
                      <p
                        style={{
                          gridColumn: '1 / -1',
                          textAlign: 'center',
                          color: '#888',
                        }}
                      >
                        Không tìm thấy địa điểm phù hợp.
                      </p>
                    )}
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
                    setSearchQuery('');
                    setFilteredBusinesses([]);
                    setIsSearching(false);
                    navigate('/discover', { replace: true });
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
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="discover-place-image">
                      <img
                        src={business.business_image?.[0] || '/placeholder.jpg'}
                        alt={business.business_name}
                        loading="lazy"
                        onError={(e) => {
                          e.target.src = '/1.png';
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
                            business.business_status ? 'open' : 'closed'
                          }`}
                        >
                          {business.business_status
                            ? 'Đang mở cửa'
                            : 'Đã đóng cửa'}
                        </span>
                        <span className="discover-rating">
                          ⭐ {business.business_rating || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredBusinesses.length === 0 && !loading && (
                  <p
                    style={{
                      gridColumn: '1 / -1',
                      textAlign: 'center',
                      color: '#888',
                    }}
                  >
                    Không tìm thấy kết quả tìm kiếm nào.
                  </p>
                )}
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
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="discover-place-image">
                          <img
                            src={
                              business.business_image?.[0] || '/placeholder.jpg'
                            }
                            alt={business.business_name}
                            loading="lazy"
                            onError={(e) => {
                              e.target.src = '/1.png';
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
                                business.business_status ? 'open' : 'closed'
                              }`}
                            >
                              {business.business_status
                                ? 'Đang mở cửa'
                                : 'Đã đóng cửa'}
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
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <h2 style={{ color: '#666', marginBottom: '20px' }}>
                Chưa có danh mục nào
              </h2>
              <p style={{ color: '#999' }}>
                Vui lòng quay lại sau để khám phá các địa điểm thú vị!
              </p>
            </div>
          )}
        </div>
      </div>

      <DiscoverAISearch />

      <Footer />
    </>
  );
}

export default DiscoverPage;
