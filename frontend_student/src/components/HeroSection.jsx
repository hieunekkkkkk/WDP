import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/HeroSection.css';

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate(); 

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim() !== '') {
      navigate(`/discover?query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <section className="hero-section">
      <div className="hero-background">
        <img src="/1.png" alt="Mountains" className="hero-bg-image" />
        <div className="hero-overlay"></div>
      </div>
      <div className="hero-content">
        <div className="hero-text">
          <h1>Lựa chọn điểm đến lý tưởng ở gần bạn</h1>
          <p>Cùng cập nhật thông tin hữu ích</p>
        </div>

        <form onSubmit={handleSearch} className="search-form">
          <div className="search-box">
            <input
              type="text"
              placeholder="Tìm kiếm địa điểm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-btn">Tìm kiếm</button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default HeroSection;
