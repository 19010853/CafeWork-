import React, { useState } from 'react';
import axios from 'axios';
const OwnerDashboardPage = () => {
  const [cafeStatus, setCafeStatus] = useState('AVAILABLE');
  const handleStatusUpdate = async (newStatus) => {
    // Đổi màu nút trên màn hình ngay lập tức cho mượt mà
    setCafeStatus(newStatus);

    try {
      // 1. Lấy thẻ bài (Token) từ trong tay nải (localStorage) ra
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert("Bệ hạ chưa đăng nhập hoặc đã mất thẻ bài!");
        return;
      }

      // 2. Lấy ID của quán cafe (Tùy thuộc vào việc ngài đang lưu nó ở đâu)
      // Thường thì khi đăng nhập xong, ta lưu luôn cafeId vào localStorage, hoặc lấy từ API profile
      const cafeId = '30000000-0000-0000-0000-000000000002'; 

      // 3. Phái sứ giả Axios mang lệnh đi (Dùng phương thức PUT hoặc PATCH để cập nhật)
      const response = await axios.patch(
        `http://localhost:8080/api/cafes/${cafeId}/seat-status`, // Lộ trình tới phủ CafeController
        {
          seatStatus: newStatus // Khối hành lý mang theo (Payload)
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // Giơ thẻ bài ra cho lính gác Spring Security
          }
        }
      );

      // 4. Nếu sứ giả về bình an (HTTP Status 200 OK)
      console.log('Báo cáo từ Backend:', response.data);
      // alert('Đã cập nhật trạng thái quán thành công!'); 
      // (Ngài có thể dùng toast notification thay cho alert để giao diện sang trọng hơn)

    } catch (error) {
      // 5. Nếu sứ giả bị chặn đánh hoặc lạc đường
      console.error("Truyền lệnh thất bại!", error);
      
      // Xử lý báo lỗi chi tiết để dễ bắt bệnh
      if (error.response) {
        // Backend có nhận được thư nhưng từ chối (Ví dụ: Lỗi 403, 404, 400)
        alert(`Bẩm, triều đình từ chối lệnh: ${error.response.data.message || 'Lỗi không xác định'}`);
      } else if (error.request) {
        // Sứ giả đi không thấy về (Chưa bật máy chủ Spring Boot)
        alert("Bẩm, không thể kết nối đến máy chủ. Xin kiểm tra lại Spring Boot!");
      } else {
        // Lỗi do bóp méo phép thuật ngay tại React
        alert("Bẩm, có lỗi nội bộ xảy ra!");
      }
      setCafeStatus('TRẠNG_THÁI_CŨ'); 
    }
  };
  // Tạo giả lập 30 ghế ngồi để hiển thị giao diện
  const seats = Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    status: 'vacant' // Tạm thời để tất cả là trống (vacant)
  }));

  return (
    <div style={styles.container}>


      {/* --- PHẦN 3: NỘI DUNG CHÍNH --- */}
      <main style={styles.main}>
        <h1 style={styles.pageTitle}>ダッシュボード</h1>

        {/* Khối 1: Cập nhật trạng thái tổng quan (Mục 8, 9, 10, 11) */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>空席・混雑状況の更新</h2>
          <div style={styles.statusCardsContainer}>
            
            {/* Nút 1: Còn trống (AVAILABLE) */}
            <button 
              style={{ 
                ...styles.statusCard, 
                ...(cafeStatus === 'AVAILABLE' ? styles.activeStatusCard : {}) 
              }}
              onClick={() => handleStatusUpdate('AVAILABLE')}
            >
              <span style={{ ...styles.dot, backgroundColor: '#34a853' }}></span> 空席あり
            </button>

            {/* Nút 2: Sắp hết chỗ (ALMOST_FULL) */}
            <button 
              style={{ 
                ...styles.statusCard, 
                ...(cafeStatus === 'ALMOST_FULL' ? styles.activeStatusCard : {}) 
              }}
              onClick={() => handleStatusUpdate('ALMOST_FULL')}
            >
              <span style={{ ...styles.dot, backgroundColor: '#fbbc04' }}></span> 残りわずか
            </button>

            {/* Nút 3: Kín chỗ (FULL) */}
            <button 
              style={{ 
                ...styles.statusCard, 
                ...(cafeStatus === 'FULL' ? styles.activeStatusCard : {}) 
              }}
              onClick={() => handleStatusUpdate('FULL')}
            >
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
};

export default OwnerDashboardPage;