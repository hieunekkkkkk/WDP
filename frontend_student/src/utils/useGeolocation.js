import { useState, useEffect } from 'react';

const useGeolocation = (autoFetch = false) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      setError('Trình duyệt không hỗ trợ định vị.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const coords = { latitude, longitude };

        localStorage.setItem('userLocation', JSON.stringify(coords));
        setLocation(coords);
        setError(null);
      },
      (err) => {
        console.error('Lỗi định vị:', err);
        setError(err.message || 'Không thể lấy vị trí');
      }
    );
  };

  useEffect(() => {
    if (autoFetch) fetchLocation();
  }, [autoFetch]);

  return { location, error, fetchLocation };
};

export default useGeolocation;
