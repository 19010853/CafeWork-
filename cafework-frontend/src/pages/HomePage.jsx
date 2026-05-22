import React, { useEffect, useState } from 'react';
import MapArea from '../components/MapArea';
import SearchBar from '../components/Search/SearchBar'; 
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
const HomePage = () => {
  const navigation = useNavigate();
  useEffect(() => {
    const userRole = localStorage.getItem('role');
    if(userRole === 'OWNER') {
      navigation('/owner/dashboard');
    }
  }, [navigation]);
  const [cafes, setCafes] = useState([]);
  // KHO LƯU TRỮ CHỈ ĐƯỜNG: Nếu có dữ liệu thì hiện bảng chỉ đường, nếu null thì hiện SearchBar
  const [routeData, setRouteData] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');

  const [searchParams] = useSearchParams();
  const keywordFromUrl = searchParams.get('keyword');
  useEffect(() => {
        if (!keywordFromUrl) return;

        setSearchKeyword(keywordFromUrl);
  }, [keywordFromUrl]);



  // Phép thuật dịch thuật: Dịch lệnh của máy chủ (tiếng Anh) sang tiếng Nhật chuẩn
  const translateStep = (step) => {
    if (step.maneuver.type === 'depart') return '出発';
    if (step.maneuver.type === 'arrive') return '目的地に到着';

    switch(step.maneuver.modifier) {
        case 'left': return '左折する';
        case 'right': return '右折する';
        case 'straight': return '直進する';
        case 'slight left': return '左方向へ進む';
        case 'slight right': return '右方向へ進む';
        case 'sharp left': return '大きく左折する';
        case 'sharp right': return '大きく右折する';
        case 'uturn': return 'Uターンする';
        default: return '進む';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', fontFamily: 'sans-serif' }}>

      {/* PHẦN THÂN CHIA 2 CỘT */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* CỘT TRÁI: SIDEBAR */}
        <div style={{ width: '400px', backgroundColor: '#fff', borderRight: '1px solid #ccc', display: 'flex', flexDirection: 'column', zIndex: 10 }}>

          {/* ==========================================
              1. BẢNG CHỈ ĐƯỜNG (Chỉ sinh ra khi có routeData)
              ========================================== */}
          {routeData && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ padding: '15px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button onClick={() => setRouteData(null)} style={{ padding: '6px 12px', backgroundColor: '#f0f0f0', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        ← 戻る
                    </button>
                    <h3 style={{ margin: 0, fontSize: '16px' }}>ルート案内</h3>
                </div>

                <div style={{ padding: '20px', borderBottom: '5px solid #f5f5f5' }}>
                    <h2 style={{ margin: '0 0 10px 0', fontSize: '24px', color: '#0066ff' }}>
                        {routeData.distance} km <span style={{ fontSize: '16px', color: '#555' }}>/ {routeData.duration} 分</span>
                    </h2>
                    <p style={{ margin: 0, fontSize: '13px', color: '#888' }}>※ 交通状況により変動します</p>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px' }}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {routeData.steps.map((step, idx) => (
                            <li key={idx} style={{ padding: '15px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '14px', color: '#333', flex: 1, paddingRight: '10px' }}>
                                    <span style={{ fontWeight: 'bold' }}>{translateStep(step)}</span>
                                    {step.name && <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{step.name}</div>}
                                </div>
                                <div style={{ fontSize: '13px', color: '#888', fontWeight: 'bold' }}>
                                    {step.distance > 0 ? `${step.distance} m` : ''}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
          )}

          {/* ==========================================
              2. Ô TÌM KIẾM VÀ DANH SÁCH QUÁN
              (Luôn tồn tại để giữ danh sách, nhưng dùng CSS để ẨN đi khi đang xem Chỉ đường)
              ========================================== */}
          <div style={{ display: routeData ? 'none' : 'block', height: '100%', overflow: 'hidden' }}>
              <SearchBar
                  onSearchData={setCafes}
                  initialKeyword={searchKeyword}
              />
          </div>

        </div>

        {/* CỘT PHẢI: BẢN ĐỒ */}
        <div style={{ flex: 1, position: 'relative' }}>
          <MapArea 
             cafes={cafes} 
             onRouteCalculated={setRouteData} 
             isRouting={!!routeData} 
          />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
