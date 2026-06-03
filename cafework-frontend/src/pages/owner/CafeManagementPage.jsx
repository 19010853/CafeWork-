import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from './CafeManagementPage.module.css';
import axiosClient from '../../api/axiosClient';
import { t } from '../../utils/i18n';

// Fix Leaflet marker icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

const CafeManagementPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    ownerName: '',
    email: '',
    phone: '',
    openHours: '',
    address: '',
    latitude: '',
    longitude: '',
    description: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [isNewCafe, setIsNewCafe] = useState(false);
  useEffect(() => {
    // 1. Lục tìm Tên và Email trong Thẻ bài (localStorage) làm vốn liếng ban đầu
    let defaultOwnerName = '';
    let defaultEmail = '';
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        defaultOwnerName = userObj.fullName || userObj.username || '';
        defaultEmail = userObj.email || '';
      }
    } catch (e) {
      console.error("Lỗi đọc thẻ bài từ localStorage", e);
    }

    const fetchMyCafe = async () => {
      try {
        const response = await axiosClient.get('/cafes/my-cafe');
        if (response.data) {
          // Gộp dữ liệu: Ưu tiên dữ liệu từ Database, nếu DB thiếu thì tự động đắp dữ liệu từ Thẻ bài vào
          setFormData({
            ...response.data,
            ownerName: response.data.ownerName || defaultOwnerName,
            email: response.data.email || defaultEmail,
          });
        }
      } catch (error) {
        // Hóa giải lỗi 404: Nếu chưa có quán, châm sẵn Tên và Email vào giấy trắng
        if (error.response && error.response.status === 404) {
          console.log('Bẩm, chủ quán mới chưa có dữ liệu. Sẵn sàng tạo quán mới!');
          setIsNewCafe(true);
          setFormData(prev => ({
            ...prev,
            ownerName: defaultOwnerName,
            email: defaultEmail,
          }));
        } else {
          console.error('Error fetching cafe data:', error);
          toast.error(t('fetchCafeFailed'));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMyCafe();
  }, []);
  // Initialize Map
  useEffect(() => {
    if (!loading && mapRef.current && !mapInstanceRef.current) {
      const initialLat = parseFloat(formData.latitude) || 21.0285;
      const initialLng = parseFloat(formData.longitude) || 105.8542;

      const map = L.map(mapRef.current).setView([initialLat, initialLng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);
      
      marker.on('dragend', (e) => {
        const { lat, lng } = e.target.getLatLng();
        setFormData(prev => ({ ...prev, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }));
      });

      map.on('click', async (e) => {
        const { lat, lng } = e.coords || e.latlng;
        marker.setLatLng([lat, lng]);
        setFormData(prev => ({ ...prev, latitude: lat.toFixed(6), longitude: lng.toFixed(6) }));
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          address: 'Đang tải địa chỉ...' // Hiệu ứng chờ cho bá tánh đỡ sốt ruột
        }));
        try {
          // Có thể thay '&accept-language=vi' thành 'ja' hoặc ngôn ngữ động tùy ý bệ hạ
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`);
          const data = await response.json();

          if (data && data.display_name) {
              // Nếu tìm thấy, cập nhật tên đường phố vào biến address
              setFormData((prev) => ({
                  ...prev,
                  address: data.display_name
              }));
          } else {
              setFormData((prev) => ({
                  ...prev,
                  address: 'Không xác định được địa chỉ'
              }));
          }
        } catch (error) {
          console.error("Lỗi khi dịch tọa độ:", error);
          setFormData((prev) => ({
              ...prev,
              address: 'Lỗi khi tải địa chỉ'
          }));
        }
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [loading]);

  // Update marker position when coordinates change manually
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      const lat = parseFloat(formData.latitude);
      const lng = parseFloat(formData.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        const currentLatLng = markerRef.current.getLatLng();
        if (currentLatLng.lat !== lat || currentLatLng.lng !== lng) {
          markerRef.current.setLatLng([lat, lng]);
          mapInstanceRef.current.panTo([lat, lng]);
        }
      }
    }
  }, [formData.latitude, formData.longitude]);

  const validate = () => {
    if (!formData.name?.trim()) return t('requiredCafeName');
    if (!formData.ownerName?.trim()) return t('requiredOwnerName');
    if (!formData.address?.trim()) return t('requiredAddress');
    
    // Đã thay thế chuỗi tiếng Việt cứng nhắc bằng hàm dịch thuật i18n
    if (formData.latitude === '' || formData.latitude === null || isNaN(parseFloat(formData.latitude))) {
        return t('invalidLatitude');
    }
    if (formData.longitude === '' || formData.longitude === null || isNaN(parseFloat(formData.longitude))) {
        return t('invalidLongitude');
    }

    // Email regex
    if (!formData.email?.trim()) return t('requiredEmail');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return t('invalidEmail');

    // Phone regex (only numbers)
    if (!formData.phone?.trim()) return t('requiredPhone');
    if (!/^\d+$/.test(formData.phone)) return t('invalidPhone');
    if (formData.phone.length < 10) {
        return t('phoneLengthError');
  }

    // OpenHours format check
    if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9] - ([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(formData.openHours)) {
        return t('openHoursFormatError');
    }

    return null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    setSubmitting(true);
    try {
      if (isNewCafe) {
        // 👑 NGẢ RẼ 1: TẠO QUÁN MỚI 👑
        // (Lưu ý: Ngài hãy kiểm tra lại Backend xem API tạo quán có đúng là POST /cafes không nhé)
        const res = await axiosClient.post('/cafes', formData); 
        toast.success(t('createSuccess') || 'Tạo quán mới thành công!');
        
        // Cực kỳ quan trọng: Lấy thẻ bài cafeId mới tinh gắn vào người chủ quán
        if (res.data && res.data.id) {
          localStorage.setItem('cafeId', res.data.id);
        }
      } else {
        // 👑 NGẢ RẼ 2: CẬP NHẬT QUÁN CŨ 👑
        await axiosClient.put('/cafes/my-cafe', formData);
        toast.success(t('updateSuccess'));
      }

      // Xong việc thì hộ giá bệ hạ vào thẳng Dashboard luôn cho tiện
      setTimeout(() => {
        window.location.href = '/owner/dashboard';
      }, 1000);

    } catch (error) {
      console.error('Error saving cafe:', error);
      const errorMsg = error.response?.data || t('updateFailed');
      toast.error(typeof errorMsg === 'string' ? errorMsg : t('updateError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '20px', color: '#8d6e63' }}>{t('loading')}</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{t('cafeManagement')}</h1>
      
      <form onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>{t('cafeName')}</label>
            <input
              type="text"
              name="name"
              className={styles.input}
              value={formData.name || ''}
              onChange={handleChange}
              placeholder={t('placeholderCafeName')}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>{t('ownerName')}</label>
            <input
              type="text"
              name="ownerName"
              className={styles.input}
              value={formData.ownerName || ''}
              onChange={handleChange}
              placeholder={t('placeholderOwnerName')}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>{t('emailAddress')}</label>
            <input
              type="email"
              name="email"
              className={styles.input}
              value={formData.email || ''}
              onChange={handleChange}
              placeholder="example@mail.com"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>{t('phoneNumber')}</label>
            <input
              type="text"
              name="phone"
              className={styles.input}
              value={formData.phone || ''}
              onChange={handleChange}
              placeholder="09012345678"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>{t('businessHours')}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              
              {/* 🕒 Ô CHỌN GIỜ MỞ CỬA */}
              <input
                type="time"
                className={styles.input}
                // Tách lấy nửa đầu (Giờ mở) từ chuỗi "HH:MM - HH:MM"
                value={formData.openHours ? formData.openHours.split(' - ')[0] : ''}
                onChange={(e) => {
                  const newOpen = e.target.value;
                  // Lấy lại giờ đóng cũ (hoặc mặc định 22:00 nếu chưa có)
                  const currentClose = (formData.openHours && formData.openHours.includes(' - ')) 
                    ? formData.openHours.split(' - ')[1] 
                    : '22:00';
                  
                  // Đóng gói thành sự kiện giả truyền về hàm handleChange gốc
                  handleChange({
                    target: { name: 'openHours', value: `${newOpen} - ${currentClose}` }
                  });
                }}
              />
              
              <span style={{ fontWeight: 'bold', color: '#555' }}>-</span>
              
              {/* 🕒 Ô CHỌN GIỜ ĐÓNG CỬA */}
              <input
                type="time"
                className={styles.input}
                // Tách lấy nửa sau (Giờ đóng) từ chuỗi "HH:MM - HH:MM"
                value={(formData.openHours && formData.openHours.includes(' - ')) ? formData.openHours.split(' - ')[1] : ''}
                onChange={(e) => {
                  const newClose = e.target.value;
                  // Lấy lại giờ mở cũ (hoặc mặc định 08:00 nếu chưa có)
                  const currentOpen = formData.openHours 
                    ? formData.openHours.split(' - ')[0] 
                    : '08:00';
                  
                  // Đóng gói thành sự kiện giả truyền về hàm handleChange gốc
                  handleChange({
                    target: { name: 'openHours', value: `${currentOpen} - ${newClose}` }
                  });
                }}
              />

            </div>
          </div>

          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label className={styles.label}>{t('address')}</label>
            <input
              type="text"
              name="address"
              className={styles.input}
              value={formData.address || ''}
              readOnly
              style={{ 
                backgroundColor: '#e9ecef', 
                color: '#495057', 
                cursor: 'not-allowed' 
              }}
              placeholder={t('placeholderAddress')}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>{t('latitude')}</label>
            <input
              type="number"
              step="any"
              name="latitude"
              className={styles.input}
              value={formData.latitude || ''}
              onChange={handleChange}
              placeholder="35.6895"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>{t('longitude')}</label>
            <input
              type="number"
              step="any"
              name="longitude"
              className={styles.input}
              value={formData.longitude || ''}
              onChange={handleChange}
              placeholder="139.6917"
            />
          </div>

          {/* Đã thêm i18n cho khối bản đồ */}
          <div className={styles.fullWidth}>
            <label className={styles.label}>{t('mapLocation')}</label>
            <div ref={mapRef} className={styles.mapContainer}></div>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              * {t('mapInstruction')}
            </p>
          </div>

          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label className={styles.label}>{t('description')}</label>
            <textarea
              name="description"
              className={styles.textarea}
              value={formData.description || ''}
              onChange={handleChange}
              placeholder={t('placeholderDescription')}
            />
          </div>
        </div>

        <button
          type="submit"
          className={styles.saveButton}
          disabled={submitting}
        >
          {/* Tự động đổi chữ: Đang lưu... / Tạo quán mới / Cập nhật */}
          {submitting ? t('saving') : (isNewCafe ? t('createCafe') : t('update'))}
        </button>
      </form>
    </div>
  );
};

export default CafeManagementPage;