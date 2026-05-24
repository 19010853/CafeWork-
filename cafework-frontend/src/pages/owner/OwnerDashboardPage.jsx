import React, { useState } from 'react';
import axios from 'axios';
import { useEffect } from 'react';
const OwnerDashboardPage = () => {
  // ==========================================
  // 1. KHO CHỨA (STATE)
  // ==========================================
  const [cafeStatus, setCafeStatus] = useState('AVAILABLE');
  const [seats, setSeats] = useState([]);
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [addAmount, setAddAmount] = useState(1);
  const [showDeletePopup, setShowDeletePopup] = useState(false); // Ẩn/hiện pop-up xóa
  const [deleteAmount, setDeleteAmount] = useState(1);           // Số lượng ghế muốn xóa
  const [blacklistIds, setBlacklistIds] = useState([]); // Kho lưu ID ghế đã chọn để xóa (nếu có)
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
      const cafeId = localStorage.getItem('cafeId') || '30000000-0000-0000-0000-000000000001';
      
      // 👉 BƯỚC MỚI: Nếu có ghế trong danh sách đen, bắt Backend xóa trước!
      if (blacklistIds.length > 0) {
        await axios.post(
          `http://localhost:8080/api/cafes/${cafeId}/seats/batch-delete`, 
          blacklistIds, // Gửi mảng các ID cần xóa đi
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setBlacklistIds([]); // Xóa xong thì làm sạch danh sách đen
      }

      // Xử lý gửi mảng ghế hiện tại (Giữ nguyên logic cũ của bệ hạ)
      const seatsToSend = seats.map(seat => {
        if (String(seat.id).startsWith('temp-')) {
          return { ...seat, id: null };
        }
        return seat;
      });

      await axios.put(
        `http://localhost:8080/api/cafes/${cafeId}/seats`, 
        seatsToSend, 
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      alert("Bẩm bệ hạ, toàn bộ thay đổi (Thêm/Xóa/Đổi màu) đã ghim chặt vào Database!");
      fetchSeats(); // Tải lại dữ liệu chuẩn từ DB
    } catch (error) {
      console.error("Lưu thất bại:", error);
      alert("Bẩm, có lỗi xảy ra khi lưu!");
    }
  };
  const handleAddNewSeats = () => {
    const amount = parseInt(addAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      alert("Bẩm, số lượng ghế phải lớn hơn 0!");
      return;
    }

    // 1. Tìm xem cái ghế có số to nhất hiện tại đang là số mấy (để đánh số tiếp theo)
    let maxSeatNum = 0;
    seats.forEach(s => {
      const num = parseInt(s.seatNumber, 10);
      if (!isNaN(num) && num > maxSeatNum) {
        maxSeatNum = num;
      }
    });
    // 2. Tạo ra các chiếc ghế ảo (tạm thời)
    const newSeats = [];
    for (let i = 1; i <= amount; i++) {
      newSeats.push({
        id: `temp-${Date.now()}-${i}`, // Dùng thời gian làm ID ảo tạm thời để React không báo lỗi
        seatNumber: (maxSeatNum + i).toString(), // Đánh số thứ tự tiếp nối
        status: 'AVAILABLE' // Mặc định ghế mới là ghế trống
      });
    }

    // 3. Đổ thêm ghế mới vào kho chứa trên màn hình
    setSeats([...seats, ...newSeats]);
    
    // 4. Giấu Pop-up đi và reset số lượng về 1
    setShowAddPopup(false);
    setAddAmount(1);
  };
  // Chiêu 6: Xóa tạm thời các ghế có số lớn nhất trên màn hình
  const handleDeleteLastSeats = () => {
    console.log("🚩 ĐÃ VÀO BÊN TRONG HÀM XÓA GHẾ!");
    const amount = parseInt(deleteAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      alert("Bẩm, số lượng ghế cần xóa phải lớn hơn 0!");
      return;
    }
    if (amount > seats.length) {
      alert(`Bẩm, quán chỉ còn ${seats.length} ghế, không thể xóa đến ${amount} ghế!`);
      return;
    }

    // 1. Sắp xếp danh sách ghế theo số ghế giảm dần để tìm những ông lớn nhất
    const sortedSeats = [...seats].sort((a, b) => parseInt(b.seatNumber, 10) - parseInt(a.seatNumber, 10));

    // 2. Lấy ra N chiếc ghế sẽ bị khai tử
    const seatsToKill = sortedSeats.slice(0, amount);
    console.log("👉 [Kính chiếu yêu] Các ghế chuẩn bị xóa:", seatsToKill);
    // 3. Lọc ra những ID thật (không phải mã temp-) để chốc nữa bắt Backend xóa trong DB
    const realIdsToKill = seatsToKill
      .map(s => s.id)
      .filter(id => id && !String(id).startsWith('temp-'));
    console.log("👉 [Kính chiếu yêu] Danh sách ID đen gửi xuống Backend:", realIdsToKill);

    // 4. Cập nhật lại màn hình: Chỉ giữ lại những ghế KHÔNG nằm trong danh sách bị khai tử
    const remainingSeats = seats.filter(s => !seatsToKill.some(kill => kill.id === s.id));
    setSeats(remainingSeats);

    // 5. Cất ID thật vào danh sách đen để chờ bấm nút Lưu
    setBlacklistIds([...blacklistIds, ...realIdsToKill]);

    // 6. Đóng pop-up và đặt lại số lượng về 1
    setShowDeletePopup(false);
    setDeleteAmount(1);
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
              <div style={{ position: 'relative', display: 'inline-block' }}>
                
                {/* Cái Pop-up nhỏ xíu sẽ hiện lên khi showAddPopup = true */}
                {showAddPopup && (
                  <div style={styles.popup}>
                    <input 
                      type="number" 
                      min="1" 
                      value={addAmount} 
                      onChange={(e) => setAddAmount(e.target.value)} 
                      style={styles.popupInput} 
                    />
                    <button onClick={handleAddNewSeats} style={styles.popupBtn}>
                      追加
                    </button>
                  </div>
                )}

                {/* Nút bật/tắt Pop-up */}
                <button 
                  style={styles.controlButton} 
                  onClick={() => setShowAddPopup(!showAddPopup)}
                >
                  + 座席追加
                </button>
              </div>
              {/* --- KHỐI XÓA GHẾ MỚI TOANH --- */}
              <div style={{ position: 'relative', display: 'inline-block' }}>
                {showDeletePopup && (
                  <div style={styles.popup}>
                    <input 
                      type="number" 
                      min="1" 
                      value={deleteAmount} 
                      onChange={(e) => setDeleteAmount(e.target.value)} 
                      style={styles.popupInput} 
                    />
                    {/* Nút bấm thực hiện lệnh xóa tạm, dùng màu đỏ cảnh báo */}
                    <button onClick={() => {
                      alert("Bẩm, chức năng xóa ghế đang trong giai đoạn thử nghiệm, chưa thể kích hoạt!");
                      handleDeleteLastSeats();
                      }} style={{ ...styles.popupBtn, backgroundColor: '#ea4335' }}>
                      削除
                    </button>
                  </div>
                )}
                <button style={styles.controlButton} onClick={() => setShowDeletePopup(!showDeletePopup)}>
                  - 座席削除
                </button>
              </div>
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
  popup: {
    position: 'absolute',
    bottom: '120%', // Đẩy pop-up bay lên trên cái nút
    left: '50%',
    transform: 'translateX(-50%)', // Căn giữa pop-up với nút
    backgroundColor: '#fff',
    border: '1px solid #ccc',
    borderRadius: '4px',
    padding: '8px',
    display: 'flex',
    gap: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 10,
    whiteSpace: 'nowrap'
  },
  popupInput: {
    width: '60px',
    padding: '6px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px'
  },
  popupBtn: {
    padding: '6px 12px',
    backgroundColor: '#34a853', // Màu xanh hoàng gia
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  }
};

export default OwnerDashboardPage;