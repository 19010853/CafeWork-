import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';

const OwnerDashboardPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [showCouponModal, setShowCouponModal] = useState(false);

  const [couponForm, setCouponForm] = useState({
    code: '',
    description: '',
    discountValue: '',
    validFrom: '',
    validTo: ''
  });
  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await axiosClient.get('/coupons/my-coupons');
      setCoupons(response.data);
    } catch (error) {
      console.error(error);
      toast.error('クーポンの取得に失敗しました');
    }
  };
  // Tạo giả lập 30 ghế ngồi để hiển thị giao diện
  const seats = Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    status: 'vacant' // Tạm thời để tất cả là trống (vacant)
  }));

  const handleCouponChange = (e) => {
    const { name, value } = e.target;

    setCouponForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const createCoupon = async () => {
    try {

      const payload = {
        ...couponForm,
        validFrom: `${couponForm.validFrom}T00:00:00`,
        validTo: `${couponForm.validTo}T23:59:59`,
      };

      await axiosClient.post('/coupons', payload);

      toast.success('クーポンを作成しました');

      setShowCouponModal(false);

      setCouponForm({
        code: '',
        description: '',
        discountValue: '',
        validFrom: '',
        validTo: '',
      });

      fetchCoupons();
    } catch (error) {
      toast.error('クーポン作成失敗');
    }
  };

  const handleDeleteCoupon = async (id) => {
    if (!window.confirm('削除しますか？')) return;

    try {
      await axiosClient.delete(`/coupons/${id}`);

      toast.success('削除しました');

      fetchCoupons();
    } catch (error) {
      console.error(error);
      toast.error('削除に失敗しました');
    }
  };

  const getCouponStatus = (validTo) => {
    return new Date(validTo) > new Date();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';

    return new Date(dateString)
        .toISOString()
        .split('T')[0]
        .replace(/-/g, '/');
  };

  return (

    <div style={styles.container}>

      {/* --- PHẦN 3: NỘI DUNG CHÍNH --- */}
      <main style={styles.main}>
        <h1 style={styles.pageTitle}>ダッシュボード</h1>

        {/* Khối 1: Cập nhật trạng thái tổng quan (Mục 8, 9, 10, 11) */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>空席・混雑状況の更新</h2>
          <div style={styles.statusCardsContainer}>
            <button style={{ ...styles.statusCard, ...styles.activeStatusCard }}>
              <span style={{ ...styles.dot, backgroundColor: '#34a853' }}></span> 空席あり
            </button>
            <button style={styles.statusCard}>
              <span style={{ ...styles.dot, backgroundColor: '#fbbc04' }}></span> 残りわずか
            </button>
            <button style={styles.statusCard}>
              <span style={{ ...styles.dot, backgroundColor: '#ea4335' }}></span> 満席
            </button>
          </div>
        </div>

        {/* Khối 2: Quản lý chi tiết ghế ngồi (Mục 12 đến 17) */}
        <div style={styles.card}>
          {/* Tiêu đề & Thống kê ghế (Mục 12, 13) */}
          <div style={styles.seatHeader}>
            <div>
              <h2 style={styles.sectionTitle}>座席管理</h2>
              <p style={styles.seatStats}>
                合計: <strong>30席</strong> &nbsp;|&nbsp; 
                <span style={{ color: '#34a853' }}> 空席: 30</span> &nbsp;|&nbsp; 
                <span style={{ color: '#ea4335' }}> 使用中: 0</span>
              </p>
            </div>
            <button style={styles.autoUpdateButton}>自動ステータス更新</button>
          </div>

          {/* Lưới hiển thị 30 ghế ngồi */}
          <div style={styles.seatGridBox}>
            <div style={styles.seatGrid}>
              {seats.map((seat) => (
                <div key={seat.id} style={styles.seatVacant}>
                  {seat.id}
                </div>
              ))}
            </div>
          </div>

          {/* Chú thích & Nút Thêm/Xóa ghế (Mục 14, 15, 16, 17) */}
          <div style={styles.seatFooter}>
            <div style={styles.legend}>
              <span style={styles.legendItem}>
                <div style={styles.legendBoxVacant}></div> 空席
              </span>
              <span style={styles.legendItem}>
                <div style={styles.legendBoxOccupied}></div> 使用中
              </span>
            </div>
            <div style={styles.controls}>
              <button style={styles.controlButton}>+ 1席追加</button>
              <button style={styles.controlButton}>- 1席削除</button>
            </div>
          </div>
        </div>
        {/* Coupon Management */}
        <div style={styles.card}>

          <div style={styles.couponHeader}>
            <h2 style={styles.sectionTitle}>割引・プロモーション一覧</h2>

            <button
                style={styles.createCouponButton}
                onClick={() => setShowCouponModal(true)}
            >
              + クーポン作成
            </button>
          </div>

          {/* FORM */}
        {showCouponModal && (
            <div style={styles.modalOverlay}>
              <div style={styles.modalContent}>

                <div style={styles.modalHeader}>
                  <h3 style={{ margin: 0 }}>クーポン作成</h3>

                  <button
                      onClick={() => setShowCouponModal(false)}
                      style={styles.closeModalButton}
                  >
                    ✕
                  </button>
                </div>

                <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      createCoupon();
                    }}
                    style={styles.couponForm}
                >
                  <input
                      type="text"
                      name="code"
                      placeholder="コード"
                      value={couponForm.code}
                      onChange={handleCouponChange}
                      style={styles.couponInput}
                  />

                  <input
                      type="text"
                      name="description"
                      placeholder="説明"
                      value={couponForm.description}
                      onChange={handleCouponChange}
                      style={styles.couponInput}
                  />

                  <input
                      type="number"
                      name="discountValue"
                      placeholder="割引％"
                      value={couponForm.discountValue}
                      onChange={handleCouponChange}
                      style={styles.couponInput}
                  />

                  <div style={styles.dateGroup}>
                    <label style={styles.inputLabel}>
                      開始日
                    </label>

                    <input
                        type="date"
                        name="validFrom"
                        value={couponForm.validFrom}
                        onChange={handleCouponChange}
                        style={styles.couponInput}
                    />
                  </div>

                  <div style={styles.dateGroup}>
                    <label style={styles.inputLabel}>
                      終了日
                    </label>

                    <input
                        type="date"
                        name="validTo"
                        value={couponForm.validTo}
                        onChange={handleCouponChange}
                        style={styles.couponInput}
                    />
                  </div>

                  <button
                      type="submit"
                      style={styles.createCouponButton}
                  >
                    + 作成
                  </button>
                </form>

              </div>
            </div>
        )}

          {/* LIST */}
          <div style={{ marginTop: '20px' }}>
            {coupons.length === 0 ? (
                <p style={{ color: '#777' }}>
                  クーポンがありません
                </p>
            ) : (
                coupons.map((coupon) => {
                  const active = getCouponStatus(coupon.validTo);

                  return (
                      <div key={coupon.id} style={styles.couponItem}>
                        <div>
                          <div style={styles.couponCode}>
                            {coupon.code}
                          </div>

                          <div style={styles.couponDescription}>
                            {coupon.description}
                          </div>

                          <div style={styles.couponDate}>
                            {formatDate(coupon.validFrom)} ~ {formatDate(coupon.validTo)}
                          </div>
                        </div>

                        <div style={{
                          display: 'flex',
                          gap: '12px',
                          alignItems: 'center'
                        }}>
                          <div
                              style={{
                                padding: '6px 12px',
                                borderRadius: '999px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                backgroundColor: active ? '#e6f4ea' : '#fce8e6',
                                color: active ? '#34a853' : '#ea4335',
                                border: active
                                    ? '1px solid #ceead6'
                                    : '1px solid #fad2cf',
                              }}
                          >
                            {active ? '有効' : '期限切れ'}
                          </div>

                          <button
                              onClick={() => handleDeleteCoupon(coupon.id)}
                              style={styles.deleteCouponButton}
                          >
                            削除
                          </button>
                        </div>
                      </div>
                  );
                })
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

// --- PHẦN 4: THUẬT TOÁN TRANG TRÍ (CSS-in-JS) ---
const styles = {
  container: {
    fontFamily: '"Noto Sans JP", sans-serif',
    backgroundColor: '#fafafa',
    minHeight: '100vh',
    color: '#333',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 24px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #eaeaea',
  },
  headerLeft: { fontSize: '14px', color: '#666', cursor: 'pointer' },
  headerCenter: { fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' },
  logoIcon: { color: '#f2a900' },
  ownerBadge: { fontSize: '10px', backgroundColor: '#f2a900', color: '#fff', padding: '2px 8px', borderRadius: '12px', marginLeft: '8px' },
  headerRight: { display: 'flex', gap: '16px', fontSize: '18px', cursor: 'pointer', color: '#666' },
  tabs: {
    display: 'flex',
    padding: '0 24px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #eaeaea',
  },
  tab: { padding: '12px 16px', fontSize: '14px', color: '#666', cursor: 'pointer', borderBottom: '2px solid transparent' },
  activeTab: { color: '#333', fontWeight: 'bold', borderBottom: '2px solid #333' },
  main: { padding: '24px', maxWidth: '1000px', margin: '0 auto' },
  pageTitle: { fontSize: '20px', fontWeight: 'bold', marginBottom: '24px' },
  card: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  sectionTitle: { fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' },
  statusCardsContainer: { display: 'flex', gap: '16px' },
  statusCard: {
    flex: 1, padding: '16px', borderRadius: '8px', border: '1px solid #eaeaea', backgroundColor: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '16px', cursor: 'pointer',
    color: '#666', transition: 'all 0.2s',
  },
  activeStatusCard: { border: '2px solid #dcdcdc', backgroundColor: '#f9f9f9', color: '#333', fontWeight: 'bold' },
  dot: { width: '12px', height: '12px', borderRadius: '50%', display: 'inline-block' },
  seatHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
  seatStats: { fontSize: '14px', color: '#666', marginTop: '4px' },
  autoUpdateButton: {
    fontSize: '12px', padding: '6px 16px', borderRadius: '16px', border: '1px solid #ccc',
    backgroundColor: '#fff', color: '#666', cursor: 'pointer',
  },
  seatGridBox: {
    backgroundColor: '#f9f9f9', padding: '24px', borderRadius: '8px', border: '1px solid #eaeaea', marginBottom: '16px',
  },
  seatGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(10, 1fr)', // Hiển thị 10 ghế mỗi hàng
    gap: '8px',
  },
  seatVacant: {
    backgroundColor: '#e6f4ea', color: '#34a853', border: '1px solid #ceead6',
    borderRadius: '4px', padding: '12px 0', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer',
  },
  seatOccupied: {
    backgroundColor: '#fce8e6', color: '#ea4335', border: '1px solid #fad2cf',
    borderRadius: '4px', padding: '12px 0', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer',
  },
  seatFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  legend: { display: 'flex', gap: '16px' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#666' },
  legendBoxVacant: { width: '12px', height: '12px', backgroundColor: '#e6f4ea', border: '1px solid #34a853', borderRadius: '2px' },
  legendBoxOccupied: { width: '12px', height: '12px', backgroundColor: '#fce8e6', border: '1px solid #ea4335', borderRadius: '2px' },
  controls: { display: 'flex', gap: '12px' },
  controlButton: {
    padding: '6px 16px', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px',
    fontSize: '14px', cursor: 'pointer', color: '#333',
  },
  couponHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },

  couponForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },

  couponInput: {
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '14px'
  },

  createCouponButton: {
    padding: '10px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#333',
    color: 'white',
    cursor: 'pointer',
    fontWeight: 'bold'
  },

  couponItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    border: '1px solid #eee',
    borderRadius: '8px',
    marginBottom: '12px',
    backgroundColor: '#fafafa'
  },

  couponCode: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '4px'
  },

  couponDescription: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '4px'
  },

  couponDate: {
    fontSize: '12px',
    color: '#999'
  },

  deleteCouponButton: {
    border: 'none',
    backgroundColor: '#ea4335',
    color: 'white',
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999
  },

  modalContent: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '12px',
    width: '500px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
  },

  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },

  closeModalButton: {
    border: 'none',
    background: 'transparent',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#666'
  },
  dateGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },

  inputLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#555'
  },
};

export default OwnerDashboardPage;