import { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import customPinImage from '../assets/my-custom-pin.png';
import defaultShadow from 'leaflet/dist/images/marker-shadow.png';

// Sửa lỗi icon marker
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Chỉnh icon marker màu đỏ để phân biệt với vị trí cafe
const myCustomIcon = L.icon({
  iconUrl: customPinImage,
  shadowUrl: defaultShadow,
  iconSize: [24, 36],
  iconAnchor: [12, 36],
  popupAnchor: [0, -32],
  shadowSize: [41, 41]
});

const MapArea = ({ cafes, onRouteCalculated, isRouting, routeTarget }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  
  // 👇 1. GỌI THÊM LÍNH CANH GIỮ TRẠNG THÁI LOADING 👇
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  const destMarkerRef = useRef(null);

  // KHO LƯU TRỮ VỊ TRÍ HIỆN TẠI VÀ ĐƯỜNG ĐI
  const userCoordsRef = useRef(null);
  const pendingRouteTargetRef = useRef(null);
  const lastRequestedRouteKeyRef = useRef(null);
  const drawRouteRef = useRef(null);
  const polylineRef = useRef(null);

  useEffect(() => {
    if (!isRouting && polylineRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }
  }, [isRouting]);

  // ----------------------------------------------------
  // HÀM VẼ ĐƯỜNG MÀU XANH TỪ VỊ TRÍ HIỆN TẠI ĐẾN QUÁN
  // ----------------------------------------------------
  const drawRoute = useCallback(async (destLat, destLng, options = {}) => {
    if (!userCoordsRef.current) {
      if (options.silentIfNoUserCoords) {
        pendingRouteTargetRef.current = [destLat, destLng];
        return;
      }
      alert("Bệ hạ vui lòng cho phép định vị trước!");
      return;
    }

    // Xóa đường cũ nếu có
    if (polylineRef.current) {
      mapInstanceRef.current.removeLayer(polylineRef.current);
    }

    // 👇 2. BẬT BẢNG HIỆU LOADING TRƯỚC KHI PHÁI SỨ GIẢ ĐI 👇
    setIsCalculatingRoute(true);

    try {
      const url = `https://router.project-osrm.org/route/v1/car/${userCoordsRef.current[1]},${userCoordsRef.current[0]};${destLng},${destLat}?overview=full&geometries=geojson&steps=true`;

      const response = await fetch(url);
      const data = await response.json();
      if (data.code !== 'Ok') return;

      // Vẽ sợi chỉ xanh
      const coordinates = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
      polylineRef.current = L.polyline(coordinates, { color: '#0066ff', weight: 6, opacity: 0.8, lineJoin: 'round' }).addTo(mapInstanceRef.current);
      mapInstanceRef.current.fitBounds(polylineRef.current.getBounds(), { padding: [50, 50] });

      // Lấy khoảng cách, thời gian và CHI TIẾT TỪNG BƯỚC ĐI
      const distance = (data.routes[0].distance / 1000).toFixed(1);
      const duration = Math.round(data.routes[0].duration / 60);
      const steps = data.routes[0].legs[0].steps;

      // PHÓNG MŨI TÊN CHUYỂN DỮ LIỆU VỀ CHO HOMEPAGE 
      if (onRouteCalculated) {
        onRouteCalculated({ distance, duration, steps });
      }

    } catch (error) { 
      console.error("Lỗi vẽ đường:", error); 
    } finally {
      // 👇 3. TẮT BẢNG HIỆU LOADING KHI LÀM XONG NHIỆM VỤ (KỂ CẢ THÀNH CÔNG HAY THẤT BẠI) 👇
      setIsCalculatingRoute(false);
    }
  }, [onRouteCalculated]);

  useEffect(() => {
    drawRouteRef.current = drawRoute;
  }, [drawRoute]);

  // ----------------------------------------------------
  // PHÉP THUẬT 1: KHỞI TẠO BẢN ĐỒ VÀ ĐỊNH VỊ 
  // ----------------------------------------------------
  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([21.0285, 105.8542], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      mapInstanceRef.current = map;
      setMapReady(true);
      markersLayerRef.current = L.layerGroup().addTo(map);

      // Định vị bệ hạ
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (mapInstanceRef.current && mapInstanceRef.current._leaflet_id) {
              const lat = parseFloat(position.coords.latitude);
              const lng = parseFloat(position.coords.longitude);
              if (!isNaN(lat) && !isNaN(lng)) {
                userCoordsRef.current = [lat, lng];
                mapInstanceRef.current.setView(userCoordsRef.current, 16);

                L.marker(userCoordsRef.current, { icon: myCustomIcon }) 
                  .addTo(mapInstanceRef.current)
                  .bindPopup('<b>あなたはここにいる!</b>')
                  .openPopup();

                L.circle(userCoordsRef.current, { radius: 100, color: 'blue', fillOpacity: 0.1 })
                  .addTo(mapInstanceRef.current);

                if (pendingRouteTargetRef.current) {
                  const [destLat, destLng] = pendingRouteTargetRef.current;
                  pendingRouteTargetRef.current = null;
                  drawRouteRef.current?.(destLat, destLng, { silentIfNoUserCoords: false });
                }
              }
            }
          },
          (error) => console.error("位置情報の取得中にエラーが発生しました。", error),
          { enableHighAccuracy: true }
        );
      }

      // LẮNG NGHE SỰ KIỆN NÚT TRONG POPUP
      map.on('popupopen', () => {
        const routeBtn = document.querySelector('.route-btn');
        if (routeBtn) {
          routeBtn.onclick = () => {
            const lat = parseFloat(routeBtn.getAttribute('data-lat'));
            const lng = parseFloat(routeBtn.getAttribute('data-lng'));
            drawRouteRef.current?.(lat, lng);
            map.closePopup(); 
          };
        }
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        setMapReady(false);
      }
    };
  }, []);

  // Auto-route 
  useEffect(() => {
    if (!routeTarget || !mapReady) return;
    const { lat, lng } = routeTarget;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const key = `${lat},${lng}`;
    if (lastRequestedRouteKeyRef.current === key) return;
    lastRequestedRouteKeyRef.current = key;

    drawRouteRef.current?.(lat, lng, { silentIfNoUserCoords: true });
  }, [routeTarget, mapReady]);

  // Show destination marker 
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;

    if (!routeTarget) {
      if (destMarkerRef.current) {
        mapInstanceRef.current.removeLayer(destMarkerRef.current);
        destMarkerRef.current = null;
      }
      return;
    }

    const { lat, lng, name } = routeTarget;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    if (destMarkerRef.current) {
      mapInstanceRef.current.removeLayer(destMarkerRef.current);
      destMarkerRef.current = null;
    }

    const label = name ? `🏁 ${name}` : '🏁 目的地';
    destMarkerRef.current = L.marker([lat, lng])
      .addTo(mapInstanceRef.current)
      .bindPopup(`<b>${label}</b>`);

    destMarkerRef.current.openPopup();
  }, [routeTarget, mapReady]);

  // ----------------------------------------------------
  // PHÉP THUẬT 2: ĐỘI QUÂN CẮM CỜ VÀ SỬA POPUP
  // ----------------------------------------------------
  useEffect(() => {
    if (mapInstanceRef.current && markersLayerRef.current && cafes) {
      markersLayerRef.current.clearLayers();

      cafes.forEach((cafe) => {
        if (cafe.latitude && cafe.longitude) {
          const imageUrl = cafe.images && cafe.images.length > 0
            ? cafe.images[0].imageUrl
            : 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=300&q=80';

          const marker = L.marker([cafe.latitude, cafe.longitude])
            .bindPopup(`
              <div className="custom-popup-card" style="width: 250px; font-family: sans-serif; padding: 5px;">
                <img src="${imageUrl}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;" />
                <h3 style="margin: 0 0 5px 0; font-size: 16px; font-weight: bold; color: #333;">${cafe.name}</h3>
                <p style="margin: 0 0 10px 0; font-size: 12px; color: #666; display: flex; align-items: center; gap: 4px;">📍 ${cafe.address}</p>
                
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                  <div style="display: flex; align-items: center; font-size: 14px; font-weight: bold; color: #333;">
                    <span style="color: #F59E0B; margin-right: 4px;">★</span>
                    ${cafe.rating || 'N/A'}
                  </div>
                  <div style="display: inline-flex; align-items: center; padding: 4px 10px; background-color: #f5f5f5; border-radius: 20px;">
                    <span style="width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; background-color: ${cafe.seatStatus === '空席あり' ? '#10B981' : (cafe.seatStatus === '満席' ? '#EF4444' : '#F59E0B')};"></span>
                    <span style="font-size: 12px; color: #555;">${cafe.seatStatus || '不明'}</span>
                  </div>
                </div>
                
                <div style="display: flex; gap: 8px;">
                  <button style="flex: 1; padding: 8px; background-color: #5c4033; color: white; border: none; border-radius: 4px; font-size: 12px; cursor: pointer;">
                    詳細を見る
                  </button>
                  
                  <button class="route-btn" data-lat="${cafe.latitude}" data-lng="${cafe.longitude}" style="flex: 1; padding: 8px; background-color: #f0f0f0; color: #333; border: 1px solid #ccc; border-radius: 4px; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;">
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
                    ルート案内
                  </button>
                </div>
              </div>
            `);

          markersLayerRef.current.addLayer(marker);
        }
      });

      if (cafes.length > 0) {
        const group = new L.featureGroup(cafes.map(c => L.marker([c.latitude, c.longitude])));
        mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
      }
    }
  }, [cafes]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <style>{`
        /* Tẩy trắng nền, làm tròn góc và đổ bóng giống Ảnh 1 */
        .leaflet-routing-container {
          background-color: #ffffff !important;
          color: #333333 !important;
          font-family: sans-serif !important;
          padding: 15px !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
          width: 320px !important;
        }
        
        /* Chỉnh lại các dòng chữ, đường kẻ của bảng */
        .leaflet-routing-alt {
          max-height: 400px !important;
          overflow-y: auto !important;
        }
        .leaflet-routing-alt h2, .leaflet-routing-alt h3 {
          font-size: 16px !important;
          font-weight: bold !important;
          border-bottom: 1px solid #eaeaea !important;
          padding-bottom: 10px !important;
          margin-bottom: 10px !important;
        }
        .leaflet-routing-alt tr { border-bottom: 1px solid #f0f0f0 !important; }
        .leaflet-routing-alt td { padding: 10px 0 !important; font-size: 13px !important; }
        
        /* Chém bỏ mấy cái nút vô dụng mặc định */
        .leaflet-routing-collapse-btn { display: none !important; }

        /* 👇 4. PHẾT SƠN CHO TẤM MÀN CHỜ LOADING 👇 */
        .route-loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(2px);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          z-index: 9999; /* Đảm bảo đè lên trên bản đồ */
        }
        .route-loading-spinner {
          width: 48px;
          height: 48px;
          border: 5px solid #f3f3f3;
          border-top: 5px solid #0066ff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* 👇 5. TẤM MÀN CHỜ SẼ HIỆN RA KHI isCalculatingRoute = true 👇 */}
      {isCalculatingRoute && (
        <div className="route-loading-overlay">
          <div className="route-loading-spinner"></div>
          <h3 style={{ margin: 0, color: '#333', fontSize: '16px' }}>ルートを計算中...</h3>
          <p style={{ margin: '8px 0 0 0', color: '#666', fontSize: '13px' }}>(Đang dò tìm lộ trình...)</p>
        </div>
      )}

      <div
        ref={mapContainerRef}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      />
    </div>
  );
};

export default MapArea;