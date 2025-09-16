import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import HeroSection from '../../components/HeroSection';
import LoadingScreen from '../../components/LoadingScreen';
import '../../css/DiscoverPage.css';
import { FaXmark } from "react-icons/fa6";

function DiscoverPage() {
  const [categories, setCategories] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get('query') || '';


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
      const res = await axios.get(`${import.meta.env.VITE_BE_URL}/api/business/search?query=${encodeURIComponent(query)}`);

      const filteredBusinesses = res.data.businesses.filter(
        (b) => b.business_active === 'active'
      );

      setFilteredBusinesses(filteredBusinesses || []);
      setSearchQuery(query);
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
        axios.get(`${import.meta.env.VITE_BE_URL}/api/business?limit=20`)
      ]);
      
      const activeBusinesses = busRes.data.businesses.filter(
        (b) => b.business_active === 'active'
      );

      setCategories(catRes.data.categories || []);
      setBusinesses(activeBusinesses || []);
    } catch (err) {
      console.error('Fetch failed:', err);
      setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
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

  return (
    <>
      <Header />
      <HeroSection />
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
                    navigate('/discover', { replace: true });
                  }}
                >
                  <FaXmark />
                </span>
              </p>
              <div className="discover-places-grid">
                {
                  filteredBusinesses.map((business) => (
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
                        <p className="discover-place-location">{business.business_address}</p>
                        <div className="discover-place-meta">
                          <span className={`discover-status ${business.business_status ? 'open' : 'closed'}`}>
                            {business.business_status ? 'Đang mở cửa' : 'Đã đóng cửa'}
                          </span>
                          <span className="discover-rating">⭐ {business.business_rating || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </section>
          )}

          {!searchQuery &&
            categories.map((cat) => (
              <section key={cat._id} className="discover-recommended-section">
                <h2 className="discover-recommended-title">{cat.category_name}</h2>
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
                          <p className="discover-place-location">{business.business_address}</p>
                          <div className="discover-place-meta">
                            <span className={`discover-status ${business.business_status ? 'open' : 'closed'}`}>
                              {business.business_status ? 'Đang mở cửa' : 'Đã đóng cửa'}
                            </span>
                            <span className="discover-rating">⭐ {business.business_rating || 0}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
                <div className="see-more-container">
                  <button className="see-more-btn" onClick={() => handleSeeMore(cat.category_name, cat._id)}>
                    Xem thêm
                  </button>
                </div>
              </section>
            ))}

          {!searchQuery && categories.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <h2 style={{ color: '#666', marginBottom: '20px' }}>Chưa có danh mục nào</h2>
              <p style={{ color: '#999' }}>Vui lòng quay lại sau để khám phá các địa điểm thú vị!</p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}

export default DiscoverPage;