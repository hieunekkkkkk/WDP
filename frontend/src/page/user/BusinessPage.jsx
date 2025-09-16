import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import LoadingScreen from '../../components/LoadingScreen';
import BusinessFeedback from '../../components/BusinessFeedback';
import { FaFacebookF, FaInstagram, FaGoogle, FaArrowLeft } from 'react-icons/fa';
import ProductDetailModal from '../../components/ProductDetailModal';
import ImageZoomModal from '../../components/ImageZoomModal';
import '../../css/BusinessPage.css';
import { getCurrentUserId } from '../../utils/useCurrentUserId';

const BusinessPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // State for business data
  const [business, setBusiness] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI State
  const [selectedImage, setSelectedImage] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Image zoom state
  const [isImageZoomOpen, setIsImageZoomOpen] = useState(false);
  const [zoomedImageUrl, setZoomedImageUrl] = useState('');

  const itemsPerSlide = 3;

  useEffect(() => {
    const fetchBusinessData = async () => {
      if (!id) {
        setError('ID doanh nghiệp không hợp lệ');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch business details and products in parallel
        const results = await Promise.allSettled([
          axios.get(`${import.meta.env.VITE_BE_URL}/api/business/${id}`),
          axios.get(`${import.meta.env.VITE_BE_URL}/api/product/business/${id}`)
        ]);

        const [businessResult, productsResult] = results;

        // Handle business data
        if (businessResult.status === 'fulfilled') {
          const fetchedBusiness = businessResult.value.data;
          setBusiness(fetchedBusiness);

          const currentUserId = getCurrentUserId();
          if (currentUserId && fetchedBusiness.owner_id === currentUserId) {
            navigate('/my-business');
            return;
          }
        } else {
          throw new Error('Không thể tải thông tin doanh nghiệp');
        }

        // Handle products data
        if (productsResult.status === 'fulfilled') {
          setProducts(productsResult.value.data?.products || []);
        } else {
          console.warn('Could not load products:', productsResult.reason);
          setProducts([]);
        }

      } catch (err) {
        console.error('Error fetching business data:', err);
        setError(err.message || 'Không thể tải dữ liệu doanh nghiệp');
      } finally {
        setLoading(false);
      }
    };

    fetchBusinessData();
  }, [id]);

  // Business detail handlers
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: business?.business_name,
        text: business?.business_detail,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Đã sao chép link vào clipboard!');
    }
  };

  const handleContact = () => {
    if (business?.business_phone) {
      window.open(`tel:${business.business_phone}`);
    }
  };

  const handleShowOnMap = () => {
    if (business?.business_location?.coordinates) {
      const [lng, lat] = business.business_location.coordinates;
      window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
    }
  };

  // Products handlers
  const totalSlides = Math.ceil(products.length / itemsPerSlide);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  const goToSlide = (index) => setCurrentSlide(index);

  const getCurrentProducts = () => {
    const startIndex = currentSlide * itemsPerSlide;
    return products.slice(startIndex, startIndex + itemsPerSlide);
  };

  const handleViewDetails = (productId) => {
    const product = products.find((p) => p._id === productId);
    if (product) {
      const transformedProduct = {
        id: product._id,
        name: product.product_name,
        price: product.product_price,
        rating: product.product_rating || 0,
        reviews: `${product.product_total_vote || 0} Đánh giá`,
        thumbnails: product.product_image || ['/1.png'],
        description: product.product_description || 'Không có mô tả',
      };
      setSelectedProduct(transformedProduct);
      setShowModal(true);
    }
  };

  const renderStars = (rating) => '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));

  // Handle image zoom
  const handleImageZoom = (imageUrl) => {
    setZoomedImageUrl(imageUrl);
    setIsImageZoomOpen(true);
  };

  const closeImageZoom = () => {
    setIsImageZoomOpen(false);
    setZoomedImageUrl('');
  };


  if (loading) {
    return <LoadingScreen />;
  }

  if (error || !business) {
    return (
      <>
        <Header />
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
          <h2>Lỗi: {error}</h2>
          <button
            onClick={() => navigate(-1)}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#ff6b35',
              color: 'white',
              border: 'none',
              borderRadius: '5px'
            }}
          >
            Quay lại
          </button>
        </div>
        <Footer />
      </>
    );
  }

  const images = business.business_image && business.business_image.length > 0
    ? business.business_image
    : ['/1.png'];

  const overallRating = business.business_rating || 0;
  const totalReviews = `${business.business_total_vote || 0} Đánh giá`;

  return (
    <>
      <Header />

      {/* Business Detail Section */}
      <section className="business-detail-section">
        <div className="business-detail">
          <div className="business-detail-container">
            <button className="back-button" onClick={() => navigate(-1)}>
              <FaArrowLeft className="back-icon" /> Quay Lại
            </button>

            <div className="business-content">
              <div className="business-images">
                <div className="main-image">
                  <img
                    src={images[selectedImage]}
                    alt={`${business.business_name} main ${selectedImage + 1}`}
                    className="main-img"
                    style={{ cursor: 'zoom-in' }}
                    onClick={() => handleImageZoom(images[selectedImage])}
                    onError={(e) => { e.target.src = '/1.png'; }}
                  />
                </div>
                <div className="thumbnail-images">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className={`thumbnail ${selectedImage === idx ? 'active' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedImage(idx);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <img
                        src={img}
                        alt={`${business.business_name} thumbnail ${idx + 1}`}
                        onError={(e) => { e.target.src = '/1.png'; }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="business-info">
                <h1 className="business-title">{business.business_name}</h1>

                <div className="business-status">
                  <span className={`status-badge ${business.business_status ? 'open' : 'closed'}`}>
                    {business.business_status ? 'Đang mở cửa' : 'Đã đóng cửa'}
                  </span>
                </div>

                <p className="business-description">
                  {business.business_detail || 'Không có mô tả chi tiết'}
                </p>

                <p className="business-category">
                  Loại hình: {business.business_category_id?.category_name || 'Chưa phân loại'}
                </p>

                <div className="rating-section">
                  <div className="stars">{renderStars(overallRating)}</div>
                  <span className="rating-count">{totalReviews}</span>
                </div>

                <div className="business-long-description">
                  <strong>Địa chỉ:</strong> {business.business_address || 'Chưa cập nhật'}
                  <br />
                  <strong>Điện thoại:</strong> {business.business_phone || 'Chưa cập nhật'}
                  <br />
                  <strong>Giờ hoạt động:</strong> {
                    business.business_time ?
                      `${business.business_time.open} - ${business.business_time.close}` :
                      'Chưa cập nhật'
                  }
                </div>

                <div className="action-buttons">
                  <button className="contact-btn" onClick={handleContact}>
                    Liên hệ
                  </button>
                  <button className="map-btn" onClick={handleShowOnMap}>
                    Hiển thị trên GG map
                  </button>
                </div>

                <div className="share-section">
                  <button className="share-link" onClick={handleShare}>
                    <span className="share-icon">↗</span> Chia sẻ
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      {products.length > 0 && (
        <section className="business-products-section">
          <div className="business-products">
            <div className="products-container">
              <h2 className="products-title">Sản phẩm kinh doanh</h2>

              <div className="products-carousel">
                <button
                  className="carousel-btn prev-btn"
                  onClick={prevSlide}
                  disabled={totalSlides <= 1}
                >
                  ‹
                </button>

                <div className="products-grid">
                  {getCurrentProducts().map((product) => (
                    <div key={product._id} className="product-card">
                      <div className="product-images">
                        <div className="product-main-image">
                          <img
                            src={product.product_image?.[0] || '/1.png'}
                            alt={product.product_name}
                            onError={(e) => { e.target.src = '/1.png'; }}
                          />
                        </div>
                      </div>

                      <div className="product-info">
                        <h3 className="product-name">{product.product_name}</h3>
                        <div className="product-price">{product.product_price} VND</div>
                        <div className="product-rating">
                          <div className="stars">{renderStars(product.product_rating || 0)}</div>
                          <span className="reviews-count">{product.product_total_vote || 0} đánh giá</span>
                        </div>
                        <button
                          className="view-details-btn"
                          onClick={() => handleViewDetails(product._id)}
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  className="carousel-btn next-btn"
                  onClick={nextSlide}
                  disabled={totalSlides <= 1}
                >
                  ›
                </button>
              </div>

              {totalSlides > 1 && (
                <div className="carousel-dots">
                  {Array.from({ length: totalSlides }).map((_, idx) => (
                    <button
                      key={idx}
                      className={`dot ${currentSlide === idx ? 'active' : ''}`}
                      onClick={() => goToSlide(idx)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Feedback Section - Use BusinessFeedback component */}
      <BusinessFeedback businessId={id} />

      <ProductDetailModal
        showModal={showModal}
        setShowModal={setShowModal}
        selectedProduct={selectedProduct}
        setSelectedProduct={setSelectedProduct}
        businessId={id}
        renderStars={renderStars}
      />

      <ImageZoomModal
        isOpen={isImageZoomOpen}
        imageUrl={zoomedImageUrl}
        onClose={closeImageZoom}
        imageAlt="Phóng to ảnh doanh nghiệp"
      />

      <Footer />
    </>
  );
};

export default BusinessPage;