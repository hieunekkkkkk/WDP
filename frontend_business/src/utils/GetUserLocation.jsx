import useGeolocation from '../utils/useGeolocation';

const GetUserLocation = () => {
  useGeolocation(true);
  return null;
};

export default GetUserLocation;
