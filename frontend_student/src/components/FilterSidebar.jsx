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
    [handleFilterChange]
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

  return (
    <div className="sidebar">
      <p className="filter-section-header">Hãy lựa chọn yêu cầu của bạn:</p>

      <div className="filter-section">
        <h4>Vị trí (≤ {localDistance} km)</h4>
        <input
          type="range"
          min="0"
          max="50"
          step="1"
          value={localDistance}
          onChange={onDistanceChange}
        />
        <div style={{ fontSize: '0.9rem', color: '#555', marginTop: '4px' }}>
          0 – {localDistance} km
        </div>
      </div>
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
            4 sao (≥ 4 ★)
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
