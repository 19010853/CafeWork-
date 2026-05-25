import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { isBookmarked, toggleBookmark } from '../utils/userLocalStore';

// ============================================================
// STYLES
// ============================================================
const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#F7F5F2',
    fontFamily: "'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif",
  },

  // ── HEADER ──
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 20px',
    borderBottom: '1px solid #eaeaea',
    backgroundColor: '#fff',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerLang: { color: '#555', cursor: 'pointer', fontSize: '14px' },
  headerLogo: { fontSize: '20px', fontWeight: 'bold', color: '#8b5a2b', cursor: 'pointer' },
  headerActions: { display: 'flex', gap: '10px' },
  btnLogin: {
    padding: '7px 16px', border: '1px solid #ccc',
    backgroundColor: '#f8f9fa', borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
  },
  btnRegister: {
    padding: '7px 16px', border: 'none',
    backgroundColor: '#5c4033', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
  },

  // ── NAV TABS ──
  navBar: {
    padding: '0 20px',
    borderBottom: '1px solid #eaeaea',
    backgroundColor: '#fff',
    display: 'flex',
  },
  navTab: {
    display: 'inline-block',
    padding: '10px 15px',
    fontSize: '14px',
    color: '#888',
    cursor: 'pointer',
    borderBottom: '3px solid transparent',
  },
  navTabActive: {
    display: 'inline-block',
    padding: '10px 15px',
    borderBottom: '3px solid #8b5a2b',
    fontWeight: 'bold',
    color: '#333',
    fontSize: '14px',
    cursor: 'pointer',
  },

  // ── BACK BUTTON ──
  backBar: {
    padding: '12px 20px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #eee',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#8b5a2b',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: 0,
    fontWeight: '500',
  },

  // ── HERO IMAGE GALLERY ──
  galleryWrap: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '0 20px',
  },
  gallery: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '4px',
    maxHeight: '360px',
    overflow: 'hidden',
  },
  galleryMain: {
    gridColumn: '1 / 3',
    gridRow: '1 / 3',
    position: 'relative',
    overflow: 'hidden',
  },
  galleryMainImg: { width: '100%', height: '360px', objectFit: 'cover', display: 'block' },
  gallerySub: { overflow: 'hidden' },
  gallerySubImg: { width: '100%', height: '178px', objectFit: 'cover', display: 'block' },
  galleryFallback: {
    width: '100%', height: '280px',
    backgroundColor: '#e9e0d5',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#a08070', fontSize: '14px',
  },

  // ── MAIN LAYOUT ──
  layout: {
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: '24px',
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '24px 20px',
  },

  // ── LEFT COLUMN ──
  leftCol: { display: 'flex', flexDirection: 'column', gap: '20px' },

  // ── NAME & RATING CARD ──
  nameCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px 24px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  nameRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' },
  cafeName: { fontSize: '24px', fontWeight: '700', color: '#1a1a1a', margin: 0, lineHeight: 1.3 },
  ratingBadge: {
    display: 'flex', alignItems: 'center', gap: '4px',
    backgroundColor: '#FFF8E7', border: '1px solid #F6C90E',
    borderRadius: '20px', padding: '4px 12px',
    fontSize: '14px', fontWeight: 'bold', color: '#b8860b',
    whiteSpace: 'nowrap', flexShrink: 0, marginLeft: '12px',
  },

  // ── SEAT STATUS ──
  statusRow: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' },
  statusTag: (cls) => ({
    display: 'inline-flex', alignItems: 'center', gap: '6px',
    padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
    ...(cls === 'available' && { backgroundColor: '#D1FAE5', color: '#065F46', border: '1px solid #6EE7B7' }),
    ...(cls === 'warning' && { backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D' }),
    ...(cls === 'full' && { backgroundColor: '#FEE2E2', color: '#991B1B', border: '1px solid #FCA5A5' }),
    ...(cls === 'unknown' && { backgroundColor: '#E5E7EB', color: '#374151', border: '1px solid #D1D5DB' }),
  }),
  statusDot: (cls) => ({
    width: '8px', height: '8px', borderRadius: '50%',
    ...(cls === 'available' && { backgroundColor: '#10B981' }),
    ...(cls === 'warning' && { backgroundColor: '#F59E0B' }),
    ...(cls === 'full' && { backgroundColor: '#EF4444' }),
    ...(cls === 'unknown' && { backgroundColor: '#9CA3AF' }),
  }),
  refreshBtn: {
    padding: '6px 12px', border: '1px solid #ddd',
    backgroundColor: '#f9f9f9', borderRadius: '6px',
    cursor: 'pointer', fontSize: '12px', color: '#555',
    display: 'flex', alignItems: 'center', gap: '4px',
  },

  // ── ACTION BUTTONS ──
  actionRow: {
    display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap',
  },
  btnFavorite: (saved) => ({
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '9px 18px', borderRadius: '8px', cursor: 'pointer',
    fontSize: '13px', fontWeight: '500', border: '1.5px solid',
    transition: 'all 0.2s',
    ...(saved
      ? { backgroundColor: '#FFF0F0', borderColor: '#F87171', color: '#DC2626' }
      : { backgroundColor: '#fff', borderColor: '#ddd', color: '#555' }),
  }),
  btnDirections: {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '9px 18px', borderRadius: '8px', cursor: 'pointer',
    fontSize: '13px', fontWeight: '500',
    backgroundColor: '#8b5a2b', color: '#fff', border: 'none',
    transition: 'opacity 0.2s',
  },

  // ── DETAILS SECTION ──
  sectionCard: {
    backgroundColor: '#fff', borderRadius: '12px',
    padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  sectionTitle: {
    fontSize: '16px', fontWeight: '700', color: '#333',
    marginBottom: '16px', paddingBottom: '10px',
    borderBottom: '2px solid #F3EDE5',
  },
  detailRow: {
    display: 'flex', alignItems: 'flex-start',
    gap: '12px', marginBottom: '14px',
    fontSize: '14px', color: '#444', lineHeight: 1.6,
  },
  detailIcon: { fontSize: '18px', flexShrink: 0, marginTop: '1px' },
  detailLabel: { fontWeight: '600', color: '#333', minWidth: '90px' },
  detailValue: { flex: 1, color: '#555' },
  phoneLink: { color: '#8b5a2b', textDecoration: 'none', fontWeight: '500' },

  // ── DESCRIPTION ──
  description: { fontSize: '14px', color: '#555', lineHeight: 1.8, margin: 0 },

  // ── COUPON BANNER ──
  couponBanner: {
    backgroundColor: '#FFF8E1',
    border: '1.5px dashed #F6C90E',
    borderRadius: '10px',
    padding: '14px 18px',
    display: 'flex', alignItems: 'center', gap: '12px',
  },
  couponIcon: { fontSize: '24px' },
  couponText: { flex: 1 },
  couponTitle: { fontSize: '14px', fontWeight: '700', color: '#7C5E00', margin: '0 0 2px 0' },
  couponSub: { fontSize: '12px', color: '#a08030', margin: 0 },

  // ── REVIEW SECTION ──
  reviewHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  reviewTitle: { fontSize: '16px', fontWeight: '700', color: '#333', margin: 0 },
  btnWriteReview: {
    padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
    fontSize: '13px', fontWeight: '500',
    backgroundColor: '#8b5a2b', color: '#fff', border: 'none',
  },
  reviewCard: {
    borderBottom: '1px solid #f0ebe4',
    paddingBottom: '14px', marginBottom: '14px',
  },
  reviewTopRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '6px' },
  reviewerName: { fontWeight: '600', fontSize: '13px', color: '#333' },
  reviewStars: { color: '#F59E0B', fontSize: '12px' },
  reviewContent: { fontSize: '13px', color: '#555', lineHeight: 1.6, margin: 0 },
  reviewEmpty: { textAlign: 'center', color: '#aaa', fontSize: '14px', padding: '20px 0' },

  // ── RIGHT COLUMN ──
  rightCol: { display: 'flex', flexDirection: 'column', gap: '16px' },

  // ── MAP CARD ──
  mapCard: {
    backgroundColor: '#fff', borderRadius: '12px',
    overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  mapHeader: { padding: '14px 18px 0', fontSize: '14px', fontWeight: '700', color: '#333' },
  mapFrame: { width: '100%', height: '260px', border: 0, display: 'block' },

  // ── LOADING / ERROR ──
  loadingWrap: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', backgroundColor: '#F7F5F2',
    flexDirection: 'column', gap: '12px',
  },
  spinner: {
    width: '36px', height: '36px',
    border: '3px solid #e5e0db', borderTop: '3px solid #8b5a2b',
    borderRadius: '50',
    animation: 'spin 0.9s linear infinite',
  },
  loadingText: { color: '#8b5a2b', fontSize: '14px' },
};

// ============================================================
// HELPERS
// ============================================================
const isLoggedIn = Boolean(localStorage.getItem('token'));
const getSeatStatusClass = (status) => {
  if (status === 'AVAILABLE') return 'available';
  if (status === 'ALMOST_FULL') return 'warning';
  if (status === 'FULL') return 'full';
  return 'unknown';
};

const getSeatStatusLabel = (status) => {
  if (status === 'AVAILABLE') return '空席あり';
  if (status === 'ALMOST_FULL') return '残りわずか';
  if (status === 'FULL') return '満席';
  return '情報なし';
};

const renderStars = (rating) => {
  if (!rating) return '—';
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - (half ? 1 : 0));
};
// (reviews are fetched from /api/reviews and filtered by cafeId)
const isJapanese = (text) => {
  if (!text) return true; // Nếu trống thì cứ coi như tiếng Nhật cho khỏi hiện nút
  // Regex quét bảng mã Unicode của tiếng Nhật
  const jpRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
  return jpRegex.test(text);
};
// ============================================================
// COMPONENT
// ============================================================
const CafeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [cafe, setCafe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(Boolean(token));
  }, [location]);

  useEffect(() => {
    setIsFavorite(isBookmarked(id));
  }, [id]);
  // Review states
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [newReviewContent, setNewReviewContent] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [translations, setTranslations] = useState({});
  // Trạng thái cờ lê báo hiệu "Đang dịch..."
  const [translatingIds, setTranslatingIds] = useState({});
  const fetchCafeDetails = () => {
    setIsRefreshing(true);
    axios
      .get(`http://localhost:8080/api/cafes/${id}`)
      .then((res) => {
        setCafe(res.data);
        setLoading(false);
        setIsRefreshing(false);
      })
      .catch((err) => {
        console.error(err);
        setError('データの読み込みに失敗しました。しばらくしてからもう一度お試しください。');
        setLoading(false);
        setIsRefreshing(false);
      });
  };

  const fetchReviews = () => {
    setReviewsLoading(true);
    axios
      .get(`http://localhost:8080/api/reviews`)
      .then((res) => {
        // Filter reviews for this cafe
        const cafeReviews = res.data.filter((r) => r.cafeId === id);
        setReviews(cafeReviews);
        setReviewsLoading(false);
      })
      .catch((err) => {
        console.error('レビュー取得エラー:', err);
        setReviews([]);
        setReviewsLoading(false);
      });
  };

  const handleSubmitReview = async () => {
    // 1. Kiểm tra an toàn: Không cho gửi giấy trắng
    if (!newReviewContent.trim()) return;

    try {
      setReviewSubmitting(true); // Bật trạng thái "Đang gửi..."

      const token = localStorage.getItem('token');
      // 3. Đóng gói tấu chương (Dữ liệu gửi lên Backend)
      // Lưu ý: Biến 'id' ở đây là ID của quán cà phê đang xem
      const payload = {
        cafeId: id,
        rating: newReviewRating,
        content: newReviewContent,
      };

      // 4. Truyền tin lên kinh thành (Gọi API)
      await axios.post('http://localhost:8080/api/reviews', payload, {
        headers: {
          // NHÁT KIẾM QUYẾT ĐỊNH: Giơ thẻ bài ra cho Cấm Vệ Quân kiểm tra
          Authorization: `Bearer ${token}`
        }
      });

      // 5. Nếu thành công, dọn dẹp chiến trường
      setNewReviewContent(''); // Xóa ô nhập chữ
      setNewReviewRating(5);   // Trả sao về lại 5
      setShowReviewModal(false); // Đóng cửa sổ lại

      // 6. Cập nhật lại danh sách để bá tánh thấy ngay tấu chương vừa viết
      // Bệ hạ hãy gọi lại hàm lấy danh sách review ở đây (ví dụ: fetchReviews())
      fetchReviews();

      // Báo hỉ
      alert("Tấu chương của bệ hạ đã được lưu danh sử sách thành công!");

    } catch (error) {
      console.error("Lỗi khi gửi tấu chương:", error);
      alert("Khởi bẩm, có lỗi xảy ra trên đường vận chuyển ạ!");
    } finally {
      // Dù thành công hay thất bại cũng phải tắt trạng thái "Đang gửi..."
      setReviewSubmitting(false);
    }
  };

  useEffect(() => {
    fetchCafeDetails();
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ── LOADING ──
  if (loading && !cafe) {
    return (
      <div style={styles.loadingWrap}>
        <div
          style={{
            width: 36, height: 36,
            border: '3px solid #e5e0db', borderTop: '3px solid #8b5a2b',
            borderRadius: '50%', animation: 'spin 0.9s linear infinite',
          }}
        />
        <p style={styles.loadingText}>読み込み中...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── ERROR ──
  if (error) {
    return (
      <div style={styles.loadingWrap}>
        <span style={{ fontSize: 32 }}>⚠️</span>
        <p style={{ color: '#888', fontSize: 14 }}>{error}</p>
        <button onClick={() => navigate(-1)} style={styles.btnRegister}>← 戻る</button>
      </div>
    );
  }

  if (!cafe) return null;

  const statusCls = getSeatStatusClass(cafe.seatStatus);
  const images = cafe.images && cafe.images.length > 0 ? cafe.images : [];
  const lat = cafe.latitude || 21.028511;
  const lng = cafe.longitude || 105.804817;

  const goToDirectionsPage = () => {
    if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) return;
    const destName = cafe?.name ? `&destName=${encodeURIComponent(cafe.name)}` : '';
    navigate(`/?destLat=${encodeURIComponent(lat)}&destLng=${encodeURIComponent(lng)}${destName}`);
  };
  const handleTranslate = async (reviewId, text) => {
    // 1. Kính chiếu yêu: Báo cáo xem có nhận được lệnh bấm nút chưa
    console.log("🚨 Lệnh dịch thuật đã phát ra! ID:", reviewId, "Nội dung:", text);

    // 2. Treo biển "Đang dịch..."
    setTranslatingIds(prev => ({ ...prev, [reviewId]: true }));

    try {
      // Dùng trạm dịch thuật miễn phí MyMemory (Từ Anh sang Nhật: en|ja)
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ja`;
      console.log("🌐 Đang chạy sang trạm dịch:", url);

      const response = await axios.get(url);
      console.log("📦 Trạm dịch trả hàng về:", response.data);

      const translatedText = response.data.responseData.translatedText;

      // 3. Cất bản dịch vào kho
      setTranslations(prev => ({ ...prev, [reviewId]: translatedText }));
      console.log("✅ Đã lưu bản dịch thành công!");

    } catch (error) {
      console.error("❌ Lỗi khi dịch thuật:", error);
      alert("Bẩm bệ hạ, sứ giả đi dịch thuật đã gặp nạn: " + error.message);
    } finally {
      // 4. Gỡ biển "Đang dịch..."
      setTranslatingIds(prev => ({ ...prev, [reviewId]: false }));
    }
  };
  return (
    <div style={styles.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #F7F5F2; }
        a { text-decoration: none; }
        button { font-family: inherit; }
        @media (max-width: 768px) {
          .detail-layout { grid-template-columns: 1fr !important; }
          .gallery-grid { grid-template-columns: 1fr !important; max-height: none !important; }
          .gallery-main { grid-column: 1 / 2 !important; grid-row: auto !important; }
          .gallery-main img { height: 220px !important; }
        }
      `}</style>

      {/* ── BACK BUTTON ── */}
      <div style={styles.backBar}>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>
          ← 検索結果に戻る
        </button>
      </div>

      {/* ── HERO GALLERY ── */}
      <div style={styles.galleryWrap}>
        <div className="gallery-grid" style={styles.gallery}>
          {images.length === 0 ? (
            // No images — placeholder
            <div style={{
              gridColumn: '1 / -1', height: '300px',
              backgroundColor: '#e9e0d5',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '8px', color: '#a08070',
            }}>
              <span style={{ fontSize: '40px' }}>📷</span>
              <span style={{ fontSize: '14px' }}>画像なし</span>
            </div>
          ) : images.length === 1 ? (
            // 1 image — full width
            <div style={{ gridColumn: '1 / -1', position: 'relative', cursor: 'pointer' }}
              onClick={() => { setSelectedPhotoIndex(0); setShowPhotoModal(true); }}>
              <img
                src={images[0].imageUrl}
                alt={cafe.name}
                style={{ width: '100%', height: '360px', objectFit: 'cover', display: 'block' }}
                onError={(e) => { e.target.onerror = null; e.target.src = ''; e.target.style.display = 'none'; }}
              />
            </div>
          ) : (
            // 2+ images — grid layout
            <>
              {/* Main image */}
              <div className="gallery-main" style={styles.galleryMain}
                onClick={() => { setSelectedPhotoIndex(0); setShowPhotoModal(true); }}>
                <img
                  src={images[0].imageUrl}
                  alt={cafe.name}
                  style={{ ...styles.galleryMainImg, cursor: 'pointer' }}
                  onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                />
              </div>

              {/* Sub images — slot 1 */}
              {images[1] && (
                <div style={{ ...styles.gallerySub, position: 'relative' }}
                  onClick={() => { setSelectedPhotoIndex(1); setShowPhotoModal(true); }}>
                  <img
                    src={images[1].imageUrl}
                    alt={`${cafe.name} 2`}
                    style={{ ...styles.gallerySubImg, cursor: 'pointer' }}
                    onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                  />
                </div>
              )}

              {/* Sub images — slot 2, with "see more" overlay if there are more */}
              {images[2] && (
                <div style={{ ...styles.gallerySub, position: 'relative', cursor: 'pointer' }}
                  onClick={() => { setSelectedPhotoIndex(2); setShowPhotoModal(true); }}>
                  <img
                    src={images[2].imageUrl}
                    alt={`${cafe.name} 3`}
                    style={{ ...styles.gallerySubImg, cursor: 'pointer' }}
                    onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                  />
                  {/* "See more" overlay — only shown when there are 4+ images */}
                  {images.length > 3 && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      backgroundColor: 'rgba(0,0,0,0.52)',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      gap: '4px', color: '#fff',
                    }}>
                      <span style={{ fontSize: '24px' }}>📷</span>
                      <span style={{ fontSize: '15px', fontWeight: '700' }}>
                        +{images.length - 3} 枚
                      </span>
                      <span style={{ fontSize: '11px', opacity: 0.85 }}>すべて見る</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="detail-layout" style={styles.layout}>

        {/* ── LEFT COLUMN ── */}
        <div style={styles.leftCol}>

          {/* Name & Rating & Status */}
          <div style={styles.nameCard}>
            <div style={styles.nameRow}>
              <h1 style={styles.cafeName}>{cafe.name}</h1>
              <div style={styles.ratingBadge}>
                ★ {cafe.rating ? Number(cafe.rating).toFixed(1) : 'レビューなし'}
              </div>
            </div>

            {/* Seat Status */}
            <div style={styles.statusRow}>
              <div style={styles.statusTag(statusCls)}>
                <span style={styles.statusDot(statusCls)} />
                {getSeatStatusLabel(cafe.seatStatus)}
              </div>
              <button
                style={styles.refreshBtn}
                onClick={fetchCafeDetails}
                disabled={isRefreshing}
              >
                🔄 {isRefreshing ? '更新中...' : '更新'}
              </button>
            </div>

            {/* Action Buttons */}
            <div style={styles.actionRow}>
              <button
                style={styles.btnFavorite(isFavorite)}
                onClick={() => {
                  const token = localStorage.getItem('token');
                  if (!token) {
                    alert('ログインが必要です。');
                    navigate('/login');
                    return;
                  }

                  const result = toggleBookmark(id);
                  setIsFavorite(result.saved);
                }}
              >
                {isFavorite ? '♥ 保存済み' : '♡ お気に入り保存'}
              </button>
              <button
                style={styles.btnDirections}
                onClick={goToDirectionsPage}
              >
                🧭 現在地からの道案内
              </button>
            </div>
          </div>

          {/* Coupon Banner */}
          <div style={styles.couponBanner}>
            <span style={styles.couponIcon}>🎫</span>
            <div style={styles.couponText}>
              <p style={styles.couponTitle}>ウェルカムクーポン：初回ドリンク 10% OFF</p>
              <p style={styles.couponSub}>アプリ提示で割引適用 · 期間限定</p>
            </div>
          </div>

          {/* Details */}
          <div style={styles.sectionCard}>
            <h2 style={styles.sectionTitle}>📋 店舗情報</h2>

            <div style={styles.detailRow}>
              <span style={styles.detailIcon}>📍</span>
              <span style={styles.detailLabel}>住所</span>
              <span style={styles.detailValue}>{cafe.address || '情報なし'}</span>
            </div>

            <div style={styles.detailRow}>
              <span style={styles.detailIcon}>🕒</span>
              <span style={styles.detailLabel}>営業時間</span>
              <span style={styles.detailValue}>{cafe.openHours || '情報なし'}</span>
            </div>

            <div style={styles.detailRow}>
              <span style={styles.detailIcon}>📞</span>
              <span style={styles.detailLabel}>電話番号</span>
              <span style={styles.detailValue}>
                {cafe.phone
                  ? <a href={`tel:${cafe.phone}`} style={styles.phoneLink}>{cafe.phone}</a>
                  : '情報なし'}
              </span>
            </div>
          </div>

          {/* Description */}
          {cafe.description && (
            <div style={styles.sectionCard}>
              <h2 style={styles.sectionTitle}>📖 お店について</h2>
              <p style={styles.description}>{cafe.description}</p>
            </div>
          )}

          {/* Reviews */}
          <div style={styles.sectionCard}>
            <div style={styles.reviewHeader}>
              <h2 style={styles.reviewTitle}>
                💬 レビュー
                {!reviewsLoading && (
                  <span style={{ fontSize: '13px', fontWeight: 'normal', color: '#999', marginLeft: '8px' }}>
                    ({reviews.length}件)
                  </span>
                )}
              </h2>
              {isLoggedIn && (
                <button style={styles.btnWriteReview} onClick={() => setShowReviewModal(true)}>
                  レビューを書く
                </button>
              )}
            </div>

            {reviewsLoading ? (
              <p style={styles.reviewEmpty}>レビューを読み込み中...</p>
            ) : reviews.length === 0 ? (
              <p style={styles.reviewEmpty}>まだレビューがありません。最初のレビューを書いてみましょう！</p>
            ) : (
              reviews.map((r) => {
                const ratingNum = parseInt(r.rating, 10) || 0;
                return (
                  <div key={r.id} style={styles.reviewCard}>
                    <div style={styles.reviewTopRow}>
                      {/* Cột chứa Tên và Ngày tháng */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={styles.reviewerName}>
                          {/* Ưu tiên hiển thị r.userName, nếu không có mới dùng ID cắt ngắn */}
                          👤 {r.userName || (r.userId ? `ユーザー #${r.userId.slice(0, 6)}` : '匿名ユーザー')}
                        </span>
                        <span style={{ fontSize: '12px', color: '#888' }}>
                          {/* Format ngày tháng sang kiểu Nhật (VD: 2026/05/17) */}
                          📅 {r.createdAt ? new Date(r.createdAt).toLocaleDateString('ja-JP') : '日付不明'}
                        </span>
                      </div>

                      <span style={styles.reviewStars}>
                        {'★'.repeat(Math.min(ratingNum, 5))}{'☆'.repeat(Math.max(0, 5 - ratingNum))}
                      </span>
                    </div>
                    <p style={styles.reviewContent}>{r.content}</p>
                    {/* 👇 CHỈ HIỂN THỊ KHỐI DỊCH THUẬT NẾU KHÔNG PHẢI TIẾNG NHẬT 👇 */}
                    {!isJapanese(r.content) && (
                      <>
                        {/* Nếu chưa có bản dịch thì hiện nút bấm */}
                        {!translations[r.id] ? (
                          <button
                            onClick={() => handleTranslate(r.id, r.content)}
                            disabled={translatingIds[r.id]}
                            style={{
                              fontSize: '12px', color: '#1a73e8', background: 'none',
                              border: 'none', cursor: 'pointer', padding: 0, marginTop: '8px',
                              display: 'flex', alignItems: 'center', gap: '4px'
                            }}
                          >
                            {translatingIds[r.id] ? '⏳ 翻訳中...' : '🌐 日本語に翻訳 (Translate)'}
                          </button>
                        ) : (
                          /* Nếu đã dịch xong thì hiện khung kết quả */
                          <div style={{
                            marginTop: '12px', padding: '10px', backgroundColor: '#f4f6f8',
                            borderRadius: '6px', borderLeft: '3px solid #1a73e8'
                          }}>
                            <span style={{ fontSize: '11px', color: '#5f6368', marginBottom: '6px', display: 'block', fontWeight: 'bold' }}>
                              🌐 Google翻訳:
                            </span>
                            <p style={{ margin: 0, fontSize: '14px', color: '#333' }} dangerouslySetInnerHTML={{ __html: translations[r.id] }} />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={styles.rightCol}>

          {/* Mini Map */}
          <div style={styles.mapCard}>
            <p style={styles.mapHeader}>🗺️ 地図・アクセス</p>
            <iframe
              title="map"
              style={styles.mapFrame}
              loading="lazy"
              allowFullScreen
              src={`https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`}
            />
            <div style={{ padding: '12px 18px' }}>
              <button
                style={{ ...styles.btnDirections, width: '100%', justifyContent: 'center' }}
                onClick={goToDirectionsPage}
              >
                🧭 アプリで道案内を見る
              </button>
            </div>
          </div>

          {/* Seat Status Summary Card */}
          <div style={{ ...styles.sectionCard, padding: '18px 20px' }}>
            <h3 style={{ ...styles.sectionTitle, fontSize: '14px', marginBottom: '14px' }}>🪑 現在の混雑状況</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: '空席あり', cls: 'available', val: cafe.seatStatus === 'AVAILABLE' },
                { label: '残りわずか', cls: 'warning', val: cafe.seatStatus === 'ALMOST_FULL' },
                { label: '満席', cls: 'full', val: cafe.seatStatus === 'FULL' },
              ].map((s) => (
                <div
                  key={s.cls}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 12px', borderRadius: '8px',
                    backgroundColor: s.val ? '#F9F5F1' : '#fafafa',
                    border: s.val ? '1.5px solid #8b5a2b' : '1px solid #eee',
                  }}
                >
                  <span style={{ ...styles.statusDot(s.cls), width: 10, height: 10 }} />
                  <span style={{ fontSize: '13px', color: '#333', flex: 1 }}>{s.label}</span>
                  {s.val && <span style={{ fontSize: '11px', color: '#8b5a2b', fontWeight: '700' }}>● 現在</span>}
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* ── REVIEW MODAL ── */}
      {showReviewModal && (
        <div
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
          }}
          onClick={() => setShowReviewModal(false)}
        >
          <div
            style={{
              backgroundColor: '#fff', borderRadius: '14px', padding: '28px 28px',
              width: '440px', maxWidth: '90vw',
              boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '18px', color: '#333' }}>
              ✍️ レビューを書く
            </h3>

            {/* Star Rating Picker */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', color: '#555', display: 'block', marginBottom: '8px' }}>
                評価 <span style={{ color: '#c00' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    onClick={() => setNewReviewRating(star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    style={{
                      fontSize: '28px', cursor: 'pointer', transition: 'transform 0.1s',
                      transform: hoveredStar >= star ? 'scale(1.2)' : 'scale(1)',
                      color: (hoveredStar || newReviewRating) >= star ? '#F59E0B' : '#ddd',
                    }}
                  >
                    ★
                  </span>
                ))}
                <span style={{ fontSize: '13px', color: '#888', alignSelf: 'center', marginLeft: '8px' }}>
                  {newReviewRating}点
                </span>
              </div>
            </div>

            {/* Content Input */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '13px', color: '#555', display: 'block', marginBottom: '6px' }}>
                コメント <span style={{ color: '#c00' }}>*</span>
              </label>
              <textarea
                rows={4}
                value={newReviewContent}
                onChange={(e) => setNewReviewContent(e.target.value)}
                placeholder="このカフェの感想を教えてください..."
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '8px',
                  border: '1.5px solid #ddd', fontSize: '13px', resize: 'vertical',
                  outline: 'none', fontFamily: 'inherit',
                  borderColor: newReviewContent.trim() ? '#8b5a2b' : '#ddd',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                style={{ ...styles.btnLogin, padding: '9px 20px' }}
                onClick={() => { setShowReviewModal(false); setNewReviewContent(''); setNewReviewRating(5); }}
                disabled={reviewSubmitting}
              >
                キャンセル
              </button>
              <button
                style={{
                  ...styles.btnRegister, padding: '9px 20px',
                  opacity: (!newReviewContent.trim() || reviewSubmitting) ? 0.6 : 1,
                  cursor: (!newReviewContent.trim() || reviewSubmitting) ? 'not-allowed' : 'pointer',
                }}
                onClick={handleSubmitReview}
                disabled={!newReviewContent.trim() || reviewSubmitting}
              >
                {reviewSubmitting ? '投稿中...' : '投稿する'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PHOTO MODAL ── */}
      {showPhotoModal && images.length > 0 && (
        <div
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.92)',
            zIndex: 300, display: 'flex', flexDirection: 'column',
          }}
          onClick={() => setShowPhotoModal(false)}
        >
          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 20px', color: '#fff', flexShrink: 0,
          }} onClick={(e) => e.stopPropagation()}>
            <span style={{ fontSize: '14px', color: '#ccc' }}>
              {cafe.name} — {selectedPhotoIndex + 1} / {images.length} 枚
            </span>
            <button
              onClick={() => setShowPhotoModal(false)}
              style={{
                background: 'none', border: 'none', color: '#fff',
                fontSize: '24px', cursor: 'pointer', lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>

          {/* Main Image */}
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', padding: '0 60px',
          }} onClick={(e) => e.stopPropagation()}>
            {/* Prev button */}
            <button
              onClick={() => setSelectedPhotoIndex((i) => (i - 1 + images.length) % images.length)}
              style={{
                position: 'absolute', left: '12px',
                background: 'rgba(255,255,255,0.15)', border: 'none',
                color: '#fff', fontSize: '22px', cursor: 'pointer',
                width: '44px', height: '44px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ‹
            </button>

            <img
              src={images[selectedPhotoIndex]?.imageUrl}
              alt={`${cafe.name} ${selectedPhotoIndex + 1}`}
              style={{
                maxWidth: '100%', maxHeight: '70vh',
                objectFit: 'contain', borderRadius: '8px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}
            />

            {/* Next button */}
            <button
              onClick={() => setSelectedPhotoIndex((i) => (i + 1) % images.length)}
              style={{
                position: 'absolute', right: '12px',
                background: 'rgba(255,255,255,0.15)', border: 'none',
                color: '#fff', fontSize: '22px', cursor: 'pointer',
                width: '44px', height: '44px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ›
            </button>
          </div>

          {/* Thumbnail Strip */}
          <div style={{
            display: 'flex', gap: '8px', padding: '16px 20px',
            overflowX: 'auto', flexShrink: 0, justifyContent: 'center',
          }} onClick={(e) => e.stopPropagation()}>
            {images.map((img, i) => (
              <img
                key={i}
                src={img.imageUrl}
                alt={`thumb ${i + 1}`}
                onClick={() => setSelectedPhotoIndex(i)}
                style={{
                  width: '64px', height: '48px', objectFit: 'cover',
                  borderRadius: '6px', cursor: 'pointer', flexShrink: 0,
                  border: i === selectedPhotoIndex
                    ? '2px solid #fff'
                    : '2px solid transparent',
                  opacity: i === selectedPhotoIndex ? 1 : 0.55,
                  transition: 'all 0.15s',
                }}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default CafeDetailPage;
