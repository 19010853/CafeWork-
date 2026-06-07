import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { getBookmarks, isBookmarked, toggleBookmark } from '../utils/userLocalStore';
import { getCafeById } from '../services/cafeService';
import styles from './profile/ProfilePage.module.css';
import { t } from '../utils/i18n';

const MyListPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [cafes, setCafes] = useState([]);
    const [error, setError] = useState('');

    const [userLocation, setUserLocation] = useState({ lat: 21.0071, lng: 105.8431 });

    useEffect(() => {
        if (!('geolocation' in navigator)) return;

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
            },
            () => {
                // Keep default
            }
        );
    }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError('');
            try {
                const ids = getBookmarks();
                if (ids.length === 0) {
                    if (!cancelled) setCafes([]);
                    return;
                }

                const results = await Promise.all(
                    ids.map(async (id) => {
                        try {
                            return await getCafeById(id);
                        } catch {
                            return null;
                        }
                    })
                );

                if (!cancelled) setCafes(results.filter(Boolean));
            } catch (e) {
                if (!cancelled) setError(e?.message || 'エラーが発生しました。');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    const gridStyles = useMemo(() => ({
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 16,
        },
        card: {
            backgroundColor: 'white',
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            cursor: 'pointer',
            border: '1px solid rgba(0,0,0,0.06)',
        },
        image: {
            width: '100%',
            height: 180,
            objectFit: 'cover',
            display: 'block',
        },
        heartBtn: {
            position: 'absolute',
            top: 12,
            right: 12,
            backgroundColor: 'white',
            border: 'none',
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
        content: {
            padding: 15,
        },
        title: {
            margin: 0,
            fontSize: 16,
            fontWeight: 'bold',
            color: '#333',
            lineHeight: 1.2,
        },
        rating: {
            fontSize: 14,
            fontWeight: 'bold',
            color: '#333',
            display: 'flex',
            alignItems: 'center',
            whiteSpace: 'nowrap',
        },
        metaLine: {
            fontSize: 12,
            color: '#888',
            marginTop: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
        },
        statusPill: {
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 10px',
            backgroundColor: '#f5f5f5',
            borderRadius: 20,
            marginTop: 10,
            width: 'fit-content',
        },
        statusText: {
            fontSize: 13,
            color: '#555',
        },
    }), []);

    const getSeatDotColor = (status) => {
        if (!status) return '#9CA3AF';
        if (status === 'AVAILABLE' || status === '空席あり') return '#10B981';
        if (status === 'FULL' || status === '満席') return '#EF4444';
        if (status === 'ALMOST_FULL' || status === '残りわずか') return '#F59E0B';
        return '#F59E0B';
    };

    const getDistanceKm = (cafe) => {
        const lat = Number(cafe?.latitude);
        const lng = Number(cafe?.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        const meters = L.latLng(userLocation.lat, userLocation.lng).distanceTo(L.latLng(lat, lng));
        if (!Number.isFinite(meters)) return null;
        return (meters / 1000).toFixed(1);
    };

    return (
        <div style={{ minHeight: 'calc(100vh - 64px)', backgroundColor: '#fdf8f5' }}>

            <style>{`
                .mylist-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
                @media (max-width: 1024px) { .mylist-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
                @media (max-width: 640px) {
                    .mylist-grid { grid-template-columns: 1fr; }
                    .mylist-grid img { height: clamp(150px, 44vw, 190px) !important; }
                }
                @media (max-width: 390px) {
                    .mylist-grid { gap: 12px; }
                }
            `}</style>

            <div className={styles.page}>
                <div className={styles.container} style={{ display: 'block' }}>
                    <div className={`${styles.card} ${styles.mainCard}`}>
                        <h1 className={styles.pageTitle}>{t('myList')}</h1>

                        {loading && <p className={styles.subText}>{t('loading')}</p>}
                        {error && <p className={styles.errorText}>{error}</p>}

                        {!loading && !error && cafes.length === 0 && (
                            <p className={styles.subText}>{t('noSavedCafes')}</p>
                        )}

                        {!loading && !error && cafes.length > 0 && (
                            <div className="mylist-grid">
                                {cafes.map((cafe) => {
                                    const saved = isBookmarked(cafe.id);
                                    const distanceKm = getDistanceKm(cafe);

                                    return (
                                        <div
                                            key={cafe.id}
                                            style={gridStyles.card}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => navigate(`/cafes/${cafe.id}`)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    navigate(`/cafes/${cafe.id}`);
                                                }
                                            }}
                                        >
                                            <div style={{ position: 'relative' }}>
                                                <img
                                                    src={cafe.images && cafe.images.length > 0 ? cafe.images[0].imageUrl : 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80'}
                                                    alt={cafe.name}
                                                    style={gridStyles.image}
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&q=80';
                                                    }}
                                                />

                                                <button
                                                    type="button"
                                                    style={gridStyles.heartBtn}
                                                    aria-label={saved ? 'お気に入り解除' : 'お気に入り保存'}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const result = toggleBookmark(cafe.id);
                                                        if (!result.saved) {
                                                            setCafes((prev) => prev.filter((x) => x.id !== cafe.id));
                                                        }
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
                                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                                    </svg>
                                                </button>
                                            </div>

                                            <div style={gridStyles.content}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                                                    <h3 style={gridStyles.title}>{cafe.name}</h3>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                                        <div style={gridStyles.rating}>
                                                            <span style={{ color: '#F59E0B', marginRight: 4 }}>★</span>
                                                            {cafe.rating ? Number(cafe.rating).toFixed(1) : '0.0'}
                                                        </div>
                                                        <div style={{ fontSize: 12, color: '#0066cc', fontWeight: 'bold' }}>
                                                            📍 {distanceKm ?? '--'} km
                                                        </div>
                                                    </div>
                                                </div>

                                                <div style={gridStyles.statusPill}>
                                                    <span
                                                        style={{
                                                            width: 8,
                                                            height: 8,
                                                            borderRadius: '50%',
                                                            marginRight: 6,
                                                            backgroundColor: getSeatDotColor(cafe.seatStatus),
                                                        }}
                                                    />
                                                    <span style={gridStyles.statusText}>{cafe.seatStatus || '不明'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyListPage;
