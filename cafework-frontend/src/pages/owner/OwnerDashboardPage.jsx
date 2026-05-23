import React, { useState } from 'react';
import axios from 'axios';
import { useEffect } from 'react';
const OwnerDashboardPage = () => {
  // ==========================================
  // 1. KHO CHỨA (STATE)
  // ==========================================
  const [cafeStatus, setCafeStatus] = useState('AVAILABLE');
  const [seats, setSeats] = useState([]);

  // ==========================================
  // 2. CÁC CHIÊU THỨC (PHẢI ĐẶT TRƯỚC KHI GỌI)
  // ==========================================
  const fetchSeats = async () => {
    try {
      const token = localStorage.getItem('token');
      // Lấy cafeId từ localStorage hoặc dùng tạm ID để test
      const cafeId = localStorage.getItem('cafeId') || '30000000-0000-0000-0000-000000000001'; 
      
      const response = await axios.get(`http://localhost:8080/api/cafes/${cafeId}/seats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Cất danh sách ghế lấy được vào kho React
      setSeats(response.data);
    } catch (error) {
      console.error("Không thể lấy danh sách ghế:", error);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    // Đổi màu nút trên màn hình ngay lập tức cho mượt mà
    setCafeStatus(newStatus);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert("Bệ hạ chưa đăng nhập hoặc đã mất thẻ bài!");
        return;
      }

      const cafeId = localStorage.getItem('cafeId'); 
      if (!cafeId) {
        alert("Bệ hạ chưa chọn quán cafe nào để quản lý!");
        return;
      }

      const response = await axios.patch(
        `http://localhost:8080/api/cafes/${cafeId}/seat-status`, 
        { seatStatus: newStatus },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      console.log('Báo cáo từ Backend:', response.data);

    } catch (error) {
      console.error("Truyền lệnh thất bại!", error);
      if (error.response) {
        alert(`Bẩm, triều đình từ chối lệnh: ${error.response.data.message || 'Lỗi không xác định'}`);
      } else if (error.request) {
        alert("Bẩm, không thể kết nối đến máy chủ. Xin kiểm tra lại Spring Boot!");
      } else {
        alert("Bẩm, có lỗi nội bộ xảy ra!");
      }
      // setCafeStatus('TRẠNG_THÁI_CŨ'); // Tạm khóa dòng này lại để khỏi lỗi
    }
  };

  // ==========================================
  // 3. LÍNH CANH (USE EFFECT) - GỌI CHIÊU KHI VỪA VÀO PHÒNG
  // ==========================================
  useEffect(() => {
    fetchSeats();
  }, []);
  // Chiêu 3: Lật trạng thái của 1 chiếc ghế trên giao diện
  const toggleSeatStatus = (seatId) => {
    setSeats(prevSeats => 
      prevSeats.map(seat => {
        if (seat.id === seatId) {
          // Bấm vào thì Trống thành Có người, Có người thành Trống
          return {
            ...seat,
            status: seat.status === 'AVAILABLE' ? 'OCCUPIED' : 'AVAILABLE'
          };
        }
        return seat;
      })
    );
  };
  // Chiêu 4: Lưu toàn bộ trạng thái ghế hiện tại về Database
  const saveSeats = async () => {
    try {
      const token = localStorage.getItem('token');
      const cafeId = localStorage.getItem('cafeId');
      
      if (!cafeId) return;

      // Phái sứ giả mang CẢ MẢNG SEATS về báo cáo
      await axios.put(
        `http://localhost:8080/api/cafes/${cafeId}/seats`, 
        seats, // Gửi nguyên mảng 30 cái ghế đi
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      alert("Bẩm, đã lưu trạng thái ghế thành công!");
      fetchSeats(); // Lưu xong thì gọi lại API để làm mới lại dữ liệu cho chắc ăn
    } catch (error) {
      console.error("Lưu ghế thất bại:", error);
      alert("Bẩm, có lỗi xảy ra khi lưu trạng thái ghế!");
    }
  };

  // ==========================================
  // 4. TÍNH TOÁN DỮ LIỆU CHUẨN BỊ CHO GIAO DIỆN
  // ==========================================
  const totalSeats = seats.length;
  const availableSeats = seats.filter(seat => seat.status === 'AVAILABLE').length;
  const occupiedSeats = seats.filter(seat => seat.status === 'OCCUPIED').length;

  // 👇 DƯỚI NÀY LÀ KHÚC RETURN CỦA BỆ HẠ 👇
  
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
          {/* Tiêu đề & Thống kê ghế THEO DỮ LIỆU THẬT */}
          <div style={styles.seatHeader}>
            <div>
              <h2 style={styles.sectionTitle}>座席管理</h2>
              <p style={styles.seatStats}>
                合計: <strong>{totalSeats}席</strong> &nbsp;|&nbsp; 
                <span style={{ color: '#34a853' }}> 空席: {availableSeats}</span> &nbsp;|&nbsp; 
                <span style={{ color: '#ea4335' }}> 使用中: {occupiedSeats}</span>
              </p>
            </div>
            {/* Tích hợp nút refresh gọi lại API lấy ghế mới nhất */}
            <button style={styles.autoUpdateButton} onClick={saveSeats}>
              🔄 最新に更新
            </button>
          </div>
          {/* Lưới hiển thị 30 ghế ngồi */}
          <div style={styles.seatGridBox}>
            <div style={styles.seatGrid}>
              {seats.map((seat) => (
                <div 
                  key={seat.id} 
                  // Dựa vào chữ AVAILABLE hay OCCUPIED để tô màu xanh hay đỏ
                  style={seat.status === 'AVAILABLE' ? styles.seatVacant : styles.seatOccupied}
                  onClick={() => toggleSeatStatus(seat.id)} // Bấm vào để đổi trạng thái
                >
                  {seat.seatNumber}
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