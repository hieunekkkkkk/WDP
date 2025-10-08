import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import useGeolocation from '../utils/useGeolocation';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../css/MapModal.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

Modal.setAppElement('#root');

const FlyToPosition = ({ position }) => {
  const map = useMap();

  useEffect(() => {
    if (position) map.flyTo(position, map.getZoom());
  }, [position, map]);

  return null;
};

const LocationMarker = ({ position, setPosition }) => {
  useMapEvents({
    click: (e) => setPosition([e.latlng.lat, e.latlng.lng]),
  });

  return (
    <Marker
      position={position}
      draggable
      eventHandlers={{
        dragend: (e) => {
          const { lat, lng } = e.target.getLatLng();
          setPosition([lat, lng]);
        },
      }}
    />
  );
};

const MapModal = ({ isOpen, onClose, onConfirm }) => {
  const { location, fetchLocation } = useGeolocation();
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (isOpen) fetchLocation();
  }, [isOpen]);

  useEffect(() => {
    if (location) setPosition([location.latitude, location.longitude]);
  }, [location]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Chọn vị trí doanh nghiệp"
      className="map-modal-content"
      overlayClassName="map-modal-overlay"
    >
      <MapContainer
        center={position || [21.0124217, 105.5227143]}
        zoom={16}
        style={{ height: '60vh', width: '100%' }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {position && (
          <>
            <FlyToPosition position={position} />
            <LocationMarker position={position} setPosition={setPosition} />
          </>
        )}
      </MapContainer>

      <div className="map-modal-buttons">
        <button className='map-modal-buttons-close' onClick={onClose}>Hủy</button>
        <button className='map-modal-buttons-success' onClick={() => onConfirm(position)}>Lấy tọa độ này</button>
      </div>
    </Modal>
  );
};

export default MapModal;
