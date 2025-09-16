// HomeAddressPage.jsx
import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import '../css/HomeAddressPage.css';
import { toast } from 'react-toastify';
import { getProvincesWithDetail } from 'vietnam-provinces';
import Select from 'react-select';

const HomeAddressPage = () => {
  const { user, isLoaded } = useUser();
  const [provinces, setProvinces] = useState([]);
  const [address, setAddress] = useState(() => {
    const addr = user?.unsafeMetadata?.homeAddress || {};
    return {
      city: addr.city || null,
      district: addr.district || null,
      ward: addr.ward || null,
      house_number: addr.house_number || '',
    };
  });

  useEffect(() => {
    const data = getProvincesWithDetail();
    setProvinces(Object.values(data));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'city') {
      const selected = provinces.find((p) => p.code === value);
      setAddress({
        city: selected,
        district: null,
        ward: null,
        house_number: address.house_number,
      });
    } else if (name === 'district') {
      const selectedDistrict = Object.values(address.city?.districts || {}).find(
        (d) => d.code === value
      );
      setAddress({ ...address, district: selectedDistrict, ward: null });
    } else if (name === 'ward') {
      const selectedWard = Object.values(address.district?.wards || {}).find(
        (w) => w.code === value
      );
      setAddress({ ...address, ward: selectedWard });
    } else {
      setAddress({ ...address, [name]: value });
    }
  };

  const handleSave = async () => {
    if (!isLoaded) return;

    const currentAddress = user?.unsafeMetadata?.homeAddress || {};

    const isSameAddress =
      currentAddress.city?.code === address.city?.code &&
      currentAddress.district?.code === address.district?.code &&
      currentAddress.ward?.code === address.ward?.code &&
      currentAddress.house_number === address.house_number;

    if (isSameAddress) {
      toast.info('Không có thay đổi nào để lưu.', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }

    try {
      await user.update({
        unsafeMetadata: {
          homeAddress: {
            city: address.city ? { code: address.city.code, name: address.city.name } : null,
            district: address.district ? { code: address.district.code, name: address.district.name } : null,
            ward: address.ward ? { code: address.ward.code, name: address.ward.name } : null,
            house_number: address.house_number,
          },
        },
      });
      toast.success('Địa chỉ cập nhật thành công!', {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (err) {
      console.error('Error updating address:', err);
      toast.error('Địa chỉ cập nhật thất bại', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const districts = address.city ? Object.values(address.city.districts || {}) : [];
  const wards = address.district ? Object.values(address.district.wards || {}) : [];

  useEffect(() => {
    if (!provinces.length) return;

    const saved = user?.unsafeMetadata?.homeAddress;
    if (!saved?.city?.code) return;

    const city = provinces.find(p => p.code === saved.city.code);
    const district = city ? Object.values(city.districts).find(d => d.code === saved.district?.code) : null;
    const ward = district ? Object.values(district.wards).find(w => w.code === saved.ward?.code) : null;

    setAddress({
      city,
      district,
      ward,
      house_number: saved.house_number || '',
    });
  }, [provinces]);

  return (
    <div className="address-container">
      <p className="address-header">Địa chỉ</p>
      <form className="address-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        <div className="address-form-group">
          <label htmlFor="city">Tỉnh/Thành phố:</label>
          <Select
            id="city"
            name="city"
            value={address.city ? { value: address.city.code, label: address.city.name } : null}
            onChange={(selectedOption) => {
              const selected = provinces.find((p) => p.code === selectedOption.value);
              setAddress({ city: selected, district: null, ward: null, house_number: address.house_number });
            }}
            options={provinces.map((p) => ({ value: p.code, label: p.name }))}
            placeholder="-- Chọn Tỉnh/Thành phố --"
            required
          />
        </div>

        <div className="address-form-group">
          <label htmlFor="district">Quận/Huyện:</label>
          <Select
            id="district"
            name="district"
            value={address.district ? { value: address.district.code, label: address.district.name } : null}
            onChange={(selectedOption) => {
              const selectedDistrict = Object.values(address.city.districts).find(
                (d) => d.code === selectedOption.value
              );
              setAddress({ ...address, district: selectedDistrict, ward: null });
            }}
            options={districts.map((d) => ({ value: d.code, label: d.name }))}
            placeholder="-- Chọn Quận/Huyện --"
            isDisabled={!address.city}
          />
        </div>

        <div className="address-form-group">
          <label htmlFor="ward">Phường/Xã:</label>
          <Select
            id="ward"
            name="ward"
            value={address.ward ? { value: address.ward.code, label: address.ward.name } : null}
            onChange={(selectedOption) => {
              const selectedWard = Object.values(address.district.wards).find(
                (w) => w.code === selectedOption.value
              );
              setAddress({ ...address, ward: selectedWard });
            }}
            options={wards.map((w) => ({ value: w.code, label: w.name }))}
            placeholder="-- Chọn Phường/Xã --"
            isDisabled={!address.district}
            required
          />
        </div>

        <div className="address-form-group">
          <label htmlFor="house_number">Tên Đường, Tòa nhà, Số nhà:</label>
          <input
            id="house_number"
            name="house_number"
            value={address.house_number}
            onChange={handleChange}
            required
          />
        </div>

        <div className="address-save-button-container">
          <button type="submit" className="address-save-button">Lưu địa chỉ</button>
        </div>
      </form>
    </div>
  );
};

export default HomeAddressPage;
