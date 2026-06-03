import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MapArea from '../components/MapArea';
import SearchBar from '../components/Search/SearchBar';
import { t } from '../utils/i18n';

const HomePage = () => {
    const navigation = useNavigate();

    // 1. Kiểm tra phân quyền
    useEffect(() => {
        const userRole = localStorage.getItem('role');
        const cafeId = localStorage.getItem('cafeId'); // 👈 Lục soát xem có thẻ bài quán chưa
        
        if (userRole === 'OWNER') {
            // Nếu có ID quán đàng hoàng -> Cho vào Bảng điều khiển (Dashboard)
            if (cafeId && cafeId !== 'null' && cafeId !== 'undefined') {
                navigation('/owner/dashboard');
            } else {
                // Nếu chưa có quán -> Bắt bẻ lái sang trang Quản lý (để tạo quán)
                navigation('/owner/management');
            }
        }
    }, [navigation]);

    // 2. KHO LƯU TRỮ TRẠNG THÁI
    const [cafes, setCafes] = useState(() => {
        const savedCafes = sessionStorage.getItem('savedCafes');
        return savedCafes ? JSON.parse(savedCafes) : [];
    });
    const [routeData, setRouteData] = useState(null);
    const [searchKeyword, setSearchKeyword] = useState(() => {
        return sessionStorage.getItem('savedKeyword') || '';
    });
    // 3. ĐỌC THÔNG SỐ TỪ URL (Chức năng của File 2)
    const [searchParams, setSearchParams] = useSearchParams();
    const keywordFromUrl = searchParams.get('keyword');

    const destLatRaw = searchParams.get('destLat');
    const destLngRaw = searchParams.get('destLng');
    const destNameRaw = searchParams.get('destName');
    
    // Đóng gói mục tiêu chỉ đường
    const routeTarget = useMemo(() => {
        if (destLatRaw == null || destLngRaw == null) return null;
        const lat = Number(destLatRaw);
        const lng = Number(destLngRaw);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return { lat, lng, name: destNameRaw || null };
    }, [destLatRaw, destLngRaw, destNameRaw]);

    // Quyết định xem có đang ở màn hình Chỉ đường hay không
    const isRoutingView = Boolean(routeData || routeTarget);

    // Xử lý từ khóa tìm kiếm
    useEffect(() => {
        if (!keywordFromUrl) return;
        setSearchKeyword(keywordFromUrl);
    }, [keywordFromUrl]);
    useEffect(() => {
        sessionStorage.setItem('savedCafes', JSON.stringify(cafes));
        sessionStorage.setItem('savedKeyword', searchKeyword);
    }, [cafes, searchKeyword]);
    // 4. PHÉP THUẬT DỊCH THUẬT (Chức năng của File 1)
    const translateStep = (step) => {
        if (step.maneuver.type === 'depart') return t('depart');
        if (step.maneuver.type === 'arrive') return t('arriveDestination');

        switch (step.maneuver.modifier) {
            case 'left': return t('turnLeft');
            case 'right': return t('turnRight');
            case 'straight': return t('goStraight');
            case 'slight left': return t('keepLeft');
            case 'slight right': return t('keepRight');
            case 'sharp left': return t('sharpLeft');
            case 'sharp right': return t('sharpRight');
            case 'uturn': return t('uTurn');
            default: return t('continue');
        }
    };

    const formatDuration = (durationInMinutes) => {
        const minutes = Number(durationInMinutes);
        if (!Number.isFinite(minutes) || minutes < 0) return '';

        const days = Math.floor(minutes / 1440);
        const hours = Math.floor((minutes % 1440) / 60);
        const remainingMinutes = minutes % 60;
        const parts = [];

        if (days > 0) parts.push(`${days} ${t('day')}`);
        if (hours > 0) parts.push(`${hours} ${t('hour')}`);
        if (remainingMinutes > 0 || parts.length === 0) parts.push(`${remainingMinutes} ${t('minute')}`);

        return parts.join(' ');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', fontFamily: 'sans-serif' }}>

            {/* PHẦN THÂN CHIA 2 CỘT */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                {/* CỘT TRÁI: SIDEBAR */}
                <div style={{ width: '400px', backgroundColor: '#fff', borderRight: '1px solid #ccc', display: 'flex', flexDirection: 'column', zIndex: 10 }}>

                    {/* ==========================================
                        1. KHỐI HIỂN THỊ CHỈ ĐƯỜNG
                        ========================================== */}
                    {isRoutingView && (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div style={{ padding: '15px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {/* Nút Back gộp cả Dịch thuật lẫn Xóa URL Param */}
                                <button
                                    onClick={() => {
                                        setRouteData(null);
                                        const next = new URLSearchParams(searchParams);
                                        next.delete('destLat');
                                        next.delete('destLng');
                                        next.delete('destName');
                                        setSearchParams(next);
                                    }}
                                    style={{ padding: '6px 12px', backgroundColor: '#f0f0f0', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    ← {t('back')}
                                </button>
                                <h3 style={{ margin: 0, fontSize: '16px' }}>{t('routeGuide')}</h3>
                            </div>

                            {/* Nếu đã lấy được lộ trình thì hiển thị */}
                            {routeData ? (
                                <>
                                    <div style={{ padding: '20px', borderBottom: '5px solid #f5f5f5' }}>
                                        <h2 style={{ margin: '0 0 10px 0', fontSize: '24px', color: '#0066ff' }}>
                                            {routeData.distance} km <span style={{ fontSize: '16px', color: '#555' }}>/ {formatDuration(routeData.duration)}</span>
                                        </h2>
                                        <p style={{ margin: 0, fontSize: '13px', color: '#888' }}>{t('trafficMayVary')}</p>
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
                                </>
                            ) : (
                                /* Nếu đang chờ cấp quyền định vị hoặc mạng chậm thì hiện bảng chờ này */
                                <div style={{ padding: '20px' }}>
                                    <p style={{ margin: 0, fontSize: '14px', color: '#555', fontWeight: 700 }}>
                                        {t('waitingForLocation')}
                                    </p>
                                    {routeTarget?.name && (
                                        <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#333', fontWeight: 700 }}>
                                            {t('routeTarget')}: {routeTarget.name}
                                        </p>
                                    )}
                                    <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#888', lineHeight: 1.5 }}>
                                        {t('locationPermissionRequired')}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ==========================================
                        2. Ô TÌM KIẾM VÀ DANH SÁCH QUÁN
                        (Ẩn đi khi đang xem màn hình chỉ đường)
                        ========================================== */}
                    <div style={{ display: isRoutingView ? 'none' : 'block', height: '100%', overflow: 'hidden' }}>
                        <SearchBar
                            onSearchData={setCafes}
                            initialKeyword={searchKeyword}
                            onKeywordChange={setSearchKeyword}
                        />
                    </div>

                </div>

                {/* CỘT PHẢI: BẢN ĐỒ */}
                <div style={{ flex: 1, position: 'relative' }}>
                    <MapArea
                        cafes={cafes}
                        onRouteCalculated={setRouteData}
                        isRouting={isRoutingView}
                        routeTarget={routeTarget}
                    />
                </div>

            </div>
        </div>
    );
};

export default HomePage;