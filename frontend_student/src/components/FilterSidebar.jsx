import React, { useState, useEffect, useCallback } from 'react';
import debounce from 'lodash.debounce';
import '../css/DiscoverByCategoryPage.css';

function FilterSidebar({ filters, handleFilterChange, fetchLocation }) {
  const [localDistance, setLocalDistance] = useState(filters.distance);

  useEffect(() => {
    setLocalDistance(filters.distance);
  }, [filters.distance]);

  const debouncedDistanceChange = useCallback(
    debounce((val) => {
      handleFilterChange('distance', val);
      if (typeof fetchLocation === 'function') {
        fetchLocation();
      }
    }, 500),
    [handleFilterChange, fetchLocation] // <-- ĐÃ SỬA: Thêm fetchLocation vào dependency
  );

  const onDistanceChange = (e) => {
    const value = Number(e.target.value);
    setLocalDistance(value);
    debouncedDistanceChange(value);
  };

  const handlePriceChange = (option) => {
    const updatedPrice = {
      ...filters.price,
      [option]: !filters.price[option],
    };
    handleFilterChange('price', updatedPrice);
  };

  const handleRatingChange = (option) => {
    const updatedRating = {
      ...filters.rating,
      [option]: !filters.rating[option],
    };
    handleFilterChange('rating', updatedRating);
  };
  
  // --- THÊM MỚI: Hàm xử lý công tắc Vị trí ---
  const handleLocationToggle = () => {
    handleFilterChange('searchByLocation', !filters.searchByLocation);
  };

  return (
    <div className="sidebar">
      <p className="filter-section-header">Hãy lựa chọn yêu cầu của bạn:</p>

      {/* ----- KHỐI VỊ TRÍ ĐÃ ĐƯỢC CẬP NHẬT ----- */}
      <div className="filter-section">
        <h4>
          Vị trí
          {/* Hiển thị text động dựa trên công tắc */}
          {filters.searchByLocation
            ? ` (≤ ${localDistance} km)`
            : ' (Mọi nơi)'}
        </h4>

        {/* Công tắc mới */}
        <label className="filter-checkbox-group" style={{marginBottom: '10px'}}>
          <input
            type="checkbox"
            checked={filters.searchByLocation}
            onChange={handleLocationToggle}
          />
          Tìm theo vị trí
        </label>

        {/* Thanh trượt */}
        <input
          type="range"
          min="0"
          max="50"
          step="1"
          value={localDistance}
          onChange={onDistanceChange}
          disabled={!filters.searchByLocation} // <-- THÊM MỚI: Vô hiệu hóa khi tắt
        />
        <div style={{ fontSize: '0.9rem', color: '#555', marginTop: '4px' }}>
          {/* Hiển thị text động dựa trên công tắc */}
          {filters.searchByLocation
            ? `0 – ${localDistance} km`
            : 'Tìm kiếm mọi nơi'}
        </div>
      </div>
      {/* ----- KẾT THÚC CẬP NHẬT KHỐI VỊ TRÍ ----- */}

      <div className="filter-section">
        <h4>Giá tiền</h4>
        <div className="filter-checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={filters.price.cheapest}
              onChange={() => handlePriceChange('cheapest')}
            />
            Rẻ nhất (≤ 50.000 VND)
          </label>
          <label>
            <input
              type="checkbox"
              checked={filters.price.mostExpensive}
              onChange={() => handlePriceChange('mostExpensive')}
            />
            Đắt nhất (≥ 50.000 VND)
          </label>
        </div>
      </div>
      <div className="filter-section">
        <h4>Đánh giá</h4>
        <div className="filter-checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={filters.rating.lowest}
              onChange={() => handleRatingChange('lowest')}
            />
            Thấp nhất (≤ 2 ★)
          </label>
          <label>
            <input
              type="checkbox"
              checked={filters.rating.highest}
              onChange={() => handleRatingChange('highest')}
            />
            Cao nhất (≥ 4 ★)
          </label>
          <label>
            <input
              type="checkbox"
              checked={filters.rating.fourStars}
              onChange={() => handleRatingChange('fourStars')}
            />
            4 sao (4 ★)
          </label>
          <label>
            <input
              type="checkbox"
              checked={filters.rating.fiveStars}
              onChange={() => handleRatingChange('fiveStars')}
            />
            5 sao (5 ★)
          </label>
        </div>
      </div>
      <div className="filter-section">
        <h4>Trạng thái</h4>
        <div className="filter-checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={filters.price.opening}
              onChange={() => handlePriceChange('opening')}
            />
            Đang mở cửa
          </label>
          <label>
            <input
              type="checkbox"
              checked={filters.price.closed}
              onChange={() => handlePriceChange('closed')}
            />
            Đã đóng cửa
          </label>
        </div>
      </div>
    </div>
  );
}

export default FilterSidebar;