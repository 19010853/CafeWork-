import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchCafes } from '../../services/cafeService';
import L from 'leaflet'; // Bổ sung Leaflet để tính khoảng cách
import { addSearchHistory, getLang, isBookmarked, toggleBookmark } from '../../utils/userLocalStore';
import './SearchBar.css';
import { t } from '../../utils/i18n';
import { getCafeAddress, getCafeName } from '../../services/translationService';

const getSavedCafes = () => {
    const savedCafes = sessionStorage.getItem('savedCafes');
    const savedLang = sessionStorage.getItem('savedCafeLang');
    if (!savedCafes || savedLang !== getLang()) return [];

    try {
        const parsed = JSON.parse(savedCafes);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const SearchBar = ({ onSearchData, initialKeyword = '', onKeywordChange }) => {
    const navigate = useNavigate();
    const userRole = localStorage.getItem('role');
    const [keyword, setKeyword] = useState(() => {
        return initialKeyword || sessionStorage.getItem('savedKeyword') || '';
    });
    const [results, setResults] = useState(getSavedCafes);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Used to force a re-render when bookmarks in localStorage change
    const [, setBookmarkTick] = useState(0);

    const [suggestions, setSuggestions] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);

    // --- STATE MỚI CHO SẮP XẾP VÀ GPS ---
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [sortBy, setSortBy] = useState('default');
    const [userLocation, setUserLocation] = useState({ lat: 21.0071, lng: 105.8431 }); // Mặc định là Bách Khoa

    const searchBoxRef = useRef(null);
    const sortMenuRef = useRef(null);
    const typingTimeoutRef = useRef(null); // Debounce cho Autocomplete
    const autocompleteAbortRef = useRef(null);
    const didInitRef = useRef(false);
    useEffect(() => {
        // Nếu vừa mở trang mà đã có kết quả trong bụng (do phục hồi trí nhớ)
        if (results.length > 0) {
            onSearchData(results); 
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const getCachedSearch = (searchKeyword) => {
        const cacheKey = `search:${getLang()}:${searchKeyword.trim().toLowerCase()}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (!cached) return null;

        try {
            const parsed = JSON.parse(cached);
            if (Date.now() - parsed.createdAt > 120000) return null;
            return parsed.data;
        } catch {
            return null;
        }
    };

    const setCachedSearch = (searchKeyword, data) => {
        const cacheKey = `search:${getLang()}:${searchKeyword.trim().toLowerCase()}`;
        sessionStorage.setItem(cacheKey, JSON.stringify({
            createdAt: Date.now(),
            data,
        }));
    };

    const handleSearchEvent = async (searchKeyword, options = {}) => {
        setShowDropdown(false);
        setLoading(true);
        setError(null);
        try {
            const shouldRecordHistory = options.recordHistory ?? true;
            if (shouldRecordHistory) {
                addSearchHistory(searchKeyword);
            }
            const shouldUseCache = !options.forceNetwork;
            const cachedData = shouldUseCache ? getCachedSearch(searchKeyword) : null;
            const data = cachedData || await searchCafes(searchKeyword, { recordHistory: shouldRecordHistory });
            if (!cachedData) {
                setCachedSearch(searchKeyword, data);
            }
            setResults(data);
            onSearchData(data);
        } catch (err) {
            console.error("Lỗi:", err);
            setError(t('searchError'));
            setResults([]);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (onKeywordChange) {
            onKeywordChange(keyword);
        }
    }, [keyword]);
    useEffect(() => {
        // Xin quyền lấy GPS thực tế của trình duyệt
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
                (err) => console.warn("Lỗi lấy GPS, đang dùng tọa độ mặc định.", err)
            );
        }

        const handleClickOutside = (event) => {
            if (searchBoxRef.current && !searchBoxRef.current.contains(event.target)) setShowDropdown(false);
            if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) setShowSortMenu(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            if (autocompleteAbortRef.current) autocompleteAbortRef.current.abort();
        };
    }, []);

    useEffect(() => {
        if (typeof initialKeyword === 'string' && initialKeyword !== keyword) {
            setKeyword(initialKeyword);
        }

        if (didInitRef.current) return;
        didInitRef.current = true;
        const kw = (typeof initialKeyword === 'string' ? initialKeyword : '').trim();
        handleSearchEvent(kw, { recordHistory: false, forceNetwork: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialKeyword]);

    const onSubmit = (e) => {
        e.preventDefault();
        handleSearchEvent(keyword, { forceNetwork: true });
    };

    // --- AUTOCOMPLETE VỚI DEBOUNCE ---
    const handleInputChange = (e) => {
        const value = e.target.value;
        setKeyword(value);

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        if (value.trim().length >= 2) {
            typingTimeoutRef.current = setTimeout(async () => {
                try {
                    if (autocompleteAbortRef.current) {
                        autocompleteAbortRef.current.abort();
                    }

                    const cachedData = getCachedSearch(value);
                    if (cachedData) {
                        setSuggestions(cachedData.slice(0, 5));
                        setShowDropdown(true);
                        return;
                    }

                    const controller = new AbortController();
                    autocompleteAbortRef.current = controller;
                    const data = await searchCafes(value, {
                        recordHistory: false,
                        signal: controller.signal,
                    });
                    setCachedSearch(value, data);
                    setSuggestions(data.slice(0, 5));
                    setShowDropdown(true);
                } catch (error) {
                    if (error.name !== 'CanceledError' && error.name !== 'AbortError') {
                        console.error("Lỗi lấy gợi ý:", error);
                    }
                }
            }, 600);
        } else {
            setShowDropdown(false);
            setSuggestions([]);

            // When cleared, show all cafes
            if (value.trim().length === 0) {
                handleSearchEvent('', { recordHistory: false, forceNetwork: true });
            }
        }
    };

    const handleSuggestionClick = (cafe) => {
        const cafeName = getCafeName(cafe);
        setKeyword(cafeName);
        setShowDropdown(false);
        handleSearchEvent(cafeName, { forceNetwork: true });
    };

    // --- THUẬT TOÁN SẮP XẾP ---
    const sortedResults = [...results].sort((a, b) => {
        if (sortBy === 'rating_desc') {
            return (b.rating || 0) - (a.rating || 0);
        } else if (sortBy === 'distance_asc') {
            const distA = L.latLng(userLocation.lat, userLocation.lng).distanceTo(L.latLng(a.latitude, a.longitude));
            const distB = L.latLng(userLocation.lat, userLocation.lng).distanceTo(L.latLng(b.latitude, b.longitude));
            return distA - distB;
        }
        return 0;
    });

    return (
        <div className="sidebar-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

            <div style={{ padding: '10px 15px', backgroundColor: 'white', zIndex: 10 }}>
                <form onSubmit={onSubmit} className="search-box-modern" ref={searchBoxRef}>
                    <div className="input-wrapper">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder={t('searchPlaceholder')}
                            value={keyword}
                            onChange={handleInputChange}
                            onFocus={() => { if (keyword.trim().length > 0) setShowDropdown(true) }}
                            className="search-input-modern"
                        />

                        {showDropdown && keyword.trim().length > 0 && (
                            <ul className="autocomplete-dropdown" style={autocompleteStyle}>
                                {suggestions.map((cafe) => (
                                    <li key={cafe.id} style={acItemStyle} onClick={() => handleSuggestionClick(cafe)}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#333' }}>📍 {getCafeName(cafe)}</span>
                                            <span style={{ fontSize: '11px', color: '#888', marginLeft: '16px' }}>{getCafeAddress(cafe)}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* BỘ LỌC CÓ MENU DROPDOWN TÍCH HỢP */}
                    <div style={{ position: 'relative' }} ref={sortMenuRef}>
                        <button type="button" className="filter-btn-square" onClick={() => setShowSortMenu(!showSortMenu)}>
                            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none">
                                <line x1="4" y1="21" x2="4" y2="14"></line>
                                <line x1="4" y1="10" x2="4" y2="3"></line>
                                <line x1="12" y1="21" x2="12" y2="12"></line>
                                <line x1="12" y1="8" x2="12" y2="3"></line>
                                <line x1="20" y1="21" x2="20" y2="16"></line>
                                <line x1="20" y1="12" x2="20" y2="3"></line>
                                <line x1="1" y1="14" x2="7" y2="14"></line>
                                <line x1="9" y1="8" x2="15" y2="8"></line>
                                <line x1="17" y1="16" x2="23" y2="16"></line>
                            </svg>
                        </button>

                        {showSortMenu && (
                            <div style={sortDropdownStyle}>
                                <div style={getSortItemStyle(sortBy === 'default')} onClick={() => { setSortBy('default'); setShowSortMenu(false); }}>
                                    {t('sortDefault')} {sortBy === 'default' && '✓'}
                                </div>
                                <div style={getSortItemStyle(sortBy === 'rating_desc')} onClick={() => { setSortBy('rating_desc'); setShowSortMenu(false); }}>
                                    {t('sortRatingHigh')} {sortBy === 'rating_desc' && '✓'}
                                </div>
                                <div style={getSortItemStyle(sortBy === 'distance_asc')} onClick={() => { setSortBy('distance_asc'); setShowSortMenu(false); }}>
                                    {t('sortNearest')} {sortBy === 'distance_asc' && '✓'}
                                </div>
                            </div>
                        )}
                    </div>
                </form>
            </div>

            <div className="results-scroll-area" style={scrollAreaStyle}>
                {loading && <p style={{ textAlign: 'center', color: '#666', fontSize: '13px' }}>{t('loadingResults')}</p>}
                {!loading && sortedResults.length === 0 && keyword && <p style={{ textAlign: 'center', color: '#666', fontSize: '13px' }}>{t('noCafeFound')}</p>}

                {sortedResults.map((cafe) => {
                    const saved = isBookmarked(cafe.id);

                    return (
                        <div
                            key={cafe.id}
                            className="cafe-card"
                            style={{ ...cardStyle, cursor: 'pointer' }}
                            role="button"
                            tabIndex={0}
                            onClick={() => navigate(`/cafes/${cafe.id}`)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    navigate(`/cafes/${cafe.id}`);
                                }
                            }}
                        >
                            {/* Khối Ảnh (Mục 9) và Nút thả tim (Mục 10) */}
                            <div style={{ position: 'relative' }}>
                                <img
                                    src={cafe.images && cafe.images.length > 0 ? cafe.images[0].imageUrl : 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80'}
                                    alt={getCafeName(cafe)}
                                    style={imageStyle}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80';
                                    }}
                                />
                                
                                {/* 👑 CHỈ CHO PHÉP KHÁCH HÀNG / USER NHÌN THẤY NÚT TIM */}
                                {userRole === 'USER' && (
                                    <button
                                        type="button"
                                        style={heartBtnStyle}
                                        aria-label={saved ? 'お気に入り解除' : 'お気に入り保存'}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            toggleBookmark(cafe.id);
                                            setBookmarkTick((t) => t + 1);
                                        }}
                                    >
                                        <svg
                                            viewBox="0 0 24 24"
                                            width="16"
                                            height="16"
                                            stroke={saved ? '#EF4444' : '#666'}
                                            strokeWidth="2"
                                            fill={saved ? '#EF4444' : 'none'}
                                        >
                                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                        </svg>
                                    </button>
                                )}
                            </div>

                            <div style={cardContentStyle}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                    <div style={{ flex: 1, paddingRight: '10px' }}>
                                        <h3 style={titleStyle}>{getCafeName(cafe)}</h3>
                                        <div style={{ fontSize: '12px', color: '#888', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {/* NẾU LỌC THEO KHOẢNG CÁCH THÌ HIỆN SỐ KM Ở ĐÂY */}
                                            {sortBy === 'distance_asc' && (
                                                <span style={{ color: '#0066cc', fontWeight: 'bold' }}>
                                                    📍 {(L.latLng(userLocation.lat, userLocation.lng).distanceTo(L.latLng(cafe.latitude, cafe.longitude)) / 1000).toFixed(1)} km
                                                </span>
                                            )}
                                            <span>🕒 {cafe.openHours || '--:--'}</span>
                                        </div>
                                    </div>
                                    <div style={ratingStyle}>
                                        <span style={{ color: '#F59E0B', marginRight: '4px' }}>★</span>
                                        {cafe.rating ? cafe.rating.toFixed(1) : '0.0'}
                                    </div>
                                </div>

                                <div style={statusWrapperStyle}>
                                    {/* 🔴 🟡 🟢 CHIẾC CHẤM BIẾN MÀU THEO STATUS */}
                                    <span style={{ 
                                        ...getStatusDotStyle(cafe.seatStatus), // Kế thừa các thuộc tính bo tròn, kích thước cũ
                                        display: 'inline-block',
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        backgroundColor: cafe.seatStatus === 'AVAILABLE' ? '#10B981' :    // Xanh lá tươi tắn
                                                        cafe.seatStatus === 'ALMOST_FULL' ? '#F59E0B' :  // Vàng hổ phách
                                                        cafe.seatStatus === 'FULL' ? '#EF4444' : '#9CA3AF' // Đỏ hoàng gia / Xám mặc định
                                    }}></span>
                                    
                                    <span style={{ fontSize: '13px', color: '#555', marginLeft: '6px' }}>
                                        {cafe.seatStatus === 'AVAILABLE' ? t('statusAvailable') : 
                                        cafe.seatStatus === 'ALMOST_FULL' ? t('statusAlmostFull') : 
                                        cafe.seatStatus === 'FULL' ? t('statusFull') : t('statusUnknown')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ==========================================
// CÁC STYLE CSS MÔ PHỎNG ĐÚNG THEO BỨC HỌA
// ==========================================

const autocompleteStyle = {
    position: 'absolute', top: '100%', left: 0, right: 0,
    backgroundColor: 'white', border: '1px solid #ddd',
    borderRadius: '4px', zIndex: 100, listStyle: 'none', padding: 0, margin: '5px 0 0 0',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxHeight: '250px', overflowY: 'auto'
};
const acItemStyle = { padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f5f5f5', transition: 'background-color 0.2s' };
const sortDropdownStyle = {
    position: 'absolute', top: '110%', right: 0, width: '220px',
    backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '8px',
    boxShadow: '0 8px 16px rgba(0,0,0,0.1)', zIndex: 10000, overflow: 'hidden'
};
const getSortItemStyle = (isActive) => ({
    padding: '12px 15px', cursor: 'pointer', fontSize: '13px',
    fontWeight: isActive ? 'bold' : 'normal',
    color: isActive ? '#8b5a2b' : '#555',
    backgroundColor: isActive ? '#fef0e6' : '#fff',
    borderBottom: '1px solid #f5f5f5',
    display: 'flex', justifyContent: 'space-between'
});
const scrollAreaStyle = { flex: 1, overflowY: 'auto', padding: '15px', backgroundColor: '#f5f5f5' };
const cardStyle = {
    backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden',
    marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    display: 'flex', flexDirection: 'column'
};
const imageStyle = { width: '100%', height: '180px', objectFit: 'cover' };
const heartBtnStyle = {
    position: 'absolute', top: '12px', right: '12px',
    backgroundColor: 'white', border: 'none', borderRadius: '50%',
    width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};
const cardContentStyle = { padding: '15px' };
const titleStyle = { margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#333' };
const ratingStyle = { fontSize: '14px', fontWeight: 'bold', color: '#333', display: 'flex', alignItems: 'center' };
const statusWrapperStyle = {
    display: 'inline-flex', alignItems: 'center',
    padding: '4px 10px', backgroundColor: '#f5f5f5', borderRadius: '20px'
};
const getStatusDotStyle = (status) => ({
    width: '8px', height: '8px', borderRadius: '50%', marginRight: '6px',
    backgroundColor: status === t('statusAvailable') ? '#10B981' : (status === t('statusFull') ? '#EF4444' : '#F59E0B')
});

export default SearchBar;
