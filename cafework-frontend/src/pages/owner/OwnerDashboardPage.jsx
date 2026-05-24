import React, { useState } from 'react';
import axios from 'axios';
import { useEffect, useRef } from 'react';
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

  const [images, setImages] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const imageInputRef = useRef(null);
  const [hoveredImageId, setHoveredImageId] = useState(null);
  const [zoomedImageUrl, setZoomedImageUrl] = useState(null);
  const [imageScale, setImageScale] = useState(1);

  const [showCouponModal, setShowCouponModal] = useState(false); // Ẩn/hiện pop-up
  const [couponForm, setCouponForm] = useState({
    code: '',
    description: '',
    discountValue: '',
    validFrom: '',
    validTo: ''    
  });
  // ==========================================
  // 2. CÁC CHIÊU THỨC (PHẢI ĐẶT TRƯỚC KHI GỌI)
  // ==========================================
  const fetchAllCafeData = async () => {
    try {
      const token = localStorage.getItem('token');
      const cafeId = localStorage.getItem('cafeId'); 
      if (!cafeId) return;

      const headers = { Authorization: `Bearer ${token}` };

      // Cử 3 đạo quân đi lấy dữ liệu cùng một lúc cho nhanh (Promise.all)
      const [seatsRes, imagesRes, couponsRes] = await Promise.all([
        axios.get(`http://localhost:8080/api/cafes/${cafeId}/seats`, { headers }),
        axios.get(`http://localhost:8080/api/cafes/${cafeId}/images`, { headers }),
        axios.get(`http://localhost:8080/api/cafes/${cafeId}/coupons`, { headers })
      ]);
      
      // Nhận hàng về và cất vào kho
      setSeats(seatsRes.data);
      setImages(imagesRes.data);
      setCoupons(couponsRes.data);

    } catch (error) {
      console.error("Lỗi khi tải tài sản quán:", error);
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

  // Chiêu thức phụ: Gọt dũa ngày tháng cho đẹp (từ 2026-05-06T... thành 2026/05/06)
  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa có hạn';
    const d = new Date(dateString);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      // BƯỚC 1: ĐÓNG GÓI VÀ NÉM ẢNH LÊN MÂY CLOUDINARY
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'CafeWork'); // Bắt buộc phải là preset Unsigned

      // Gửi thẳng sang server của Cloudinary (Không gửi kèm token của ngài nhé)
      const cloudinaryRes = await axios.post(
        `https://api.cloudinary.com/v1_1/dcc0jvcs5/image/upload`,
        formData
      );

      // Cloudinary trả về một đường link xịn xò bảo mật
      const uploadedImageUrl = cloudinaryRes.data.secure_url; 
      console.log("👉 Đã ném lên mây, lấy được link:", uploadedImageUrl);

      // BƯỚC 2: CẦM ĐƯỜNG LINK VỀ NỘP CHO SPRING BOOT
      const token = localStorage.getItem('token');
      const cafeId = localStorage.getItem('cafeId');
      
      await axios.post(
        `http://localhost:8080/api/cafes/${cafeId}/images`, 
        { imageUrl: uploadedImageUrl }, // Chỉ gửi một cục JSON chứa URL
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      alert("Bẩm bệ hạ, ảnh đã được treo lên tường thành công!");
      fetchAllCafeData(); // Tải lại trang để ảnh hiện ra

    } catch (error) {
      console.error("Lỗi tải ảnh:", error);
      alert("Bẩm, phép thuật tải ảnh đã thất bại!");
    } finally {
      event.target.value = null; // Dọn dẹp cơ quan ngầm
    }
  };
  // Chiêu thức: Đóng cảnh giới hư không và reset tỷ lệ
  const handleCloseZoomModal = () => {
    setZoomedImageUrl(null);
    setImageScale(1); 
  };

  // Chiêu thức: Nhận diện vòng quay của con lăn chuột
  const handleWheelZoom = (e) => {
    if (e.deltaY < 0) {
      // Lăn chuột lên (deltaY âm) -> Phóng to thêm 15%, giới hạn to tối đa 5 lần
      setImageScale(prev => Math.min(prev + 0.15, 5));
    } else {
      // Lăn chuột xuống (deltaY dương) -> Thu nhỏ đi 15%, giới hạn nhỏ tối thiểu 0.3 lần
      setImageScale(prev => Math.max(prev - 0.15, 0.3));
    }
  };
  // Chiêu thức 8: Ban lệnh chém ảnh
  const handleDeleteImage = async (imageId) => {
    // Hỏi lại một câu cho chắc chắn trước khi ra tay
    const confirmDelete = window.confirm("Bệ hạ có chắc chắn muốn thiêu rụi bức ảnh này không?");
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('token');
      const cafeId = localStorage.getItem('cafeId');
      if (!cafeId) return;

      // Phái sứ giả mang lệnh chém xuống Spring Boot
      await axios.delete(
        `http://localhost:8080/api/cafes/${cafeId}/images/${imageId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Cập nhật lại giao diện: Lọc bỏ bức ảnh vừa bị chém ra khỏi mảng images
      setImages(prevImages => prevImages.filter(img => img.id !== imageId));
      
      // Giấu luôn lớp mặt nạ đi kẻo nó bị kẹt lại
      setHoveredImageId(null); 

    } catch (error) {
      console.error("Lỗi khi xóa ảnh:", error);
      alert("Bẩm, xóa ảnh thất bại do sự cố kỹ thuật!");
    }
  };
  
  // Chiêu thức 9: Gửi lệnh đúc Coupon xuống Database
  const handleCreateCoupon = async () => {
    if (!couponForm.code || !couponForm.discountValue || !couponForm.validFrom || !couponForm.validTo) {
      alert("Bẩm bệ hạ, xin hãy điền đầy đủ các thông tin bắt buộc!");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const cafeId = localStorage.getItem('cafeId');
      
      // 👇 CHÉM NHÁT KIẾM NÀY VÀO ĐÂY: Đắp thêm cái đuôi thời gian 👇
      const submitData = {
        ...couponForm,
        validFrom: `${couponForm.validFrom}T00:00:00`, // Ép thành 0 giờ 0 phút sáng
        validTo: `${couponForm.validTo}T23:59:59`      // Ép thành 11 giờ 59 phút đêm
      };

      // Sứ giả mang tờ khai chuẩn (submitData) xuống Spring Boot
      await axios.post(
        `http://localhost:8080/api/cafes/${cafeId}/coupons`,
        submitData, // 👈 Truyền submitData thay vì couponForm
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      alert("Bẩm, vé khuyến mãi mới đã được phát hành thành công!");
      
      setShowCouponModal(false);
      setCouponForm({ code: '', description: '', discountValue: '', validFrom: '', validTo: '' });
      fetchAllCafeData();

    } catch (error) {
      console.error("Lỗi khi đúc vé:", error);
      alert("Bẩm, có lỗi xảy ra khi tạo vé khuyến mãi!");
    }
  };

  // Chiêu thức 10: Xé bỏ vé khuyến mãi
  const handleDeleteCoupon = async (couponId) => {
    // Hỏi lại thánh ý một lần cho chắc chắn
    const confirmDelete = window.confirm("Bệ hạ có chắc chắn muốn xé bỏ tấm vé khuyến mãi này không?");
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('token');
      const cafeId = localStorage.getItem('cafeId');
      if (!cafeId) return;

      // Phái Sứ giả mang lệnh hành quyết xuống Spring Boot
      await axios.delete(
        `http://localhost:8080/api/cafes/${cafeId}/coupons/${couponId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Cập nhật lại giao diện: Lọc bỏ tấm vé vừa bị xé ra khỏi danh sách
      setCoupons(prevCoupons => prevCoupons.filter(coupon => coupon.id !== couponId));

    } catch (error) {
      console.error("Lỗi khi xé vé:", error);
      alert("Bẩm, lệnh tiêu hủy vé gặp trục trặc kỹ thuật!");
    }
  };
  // ==========================================
  // 3. LÍNH CANH (USE EFFECT) - GỌI CHIÊU KHI VỪA VÀO PHÒNG
  // ==========================================
  useEffect(() => {
    fetchAllCafeData();
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
      fetchAllCafeData(); // Tải lại dữ liệu chuẩn từ DB
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
        {/* ========================================= */}
        {/* KHỐI 3: QUẢN LÝ ẢNH (写真管理) */}
        {/* ========================================= */}
        <div style={styles.card}>
          <h2 style={styles.sectionTitle}>写真管理</h2>
          
          <div style={styles.imageContainer}>
            <input 
              type="file" 
              ref={imageInputRef} 
              style={{ display: 'none' }} 
              accept="image/*" 
              onChange={handleImageUpload} 
            />
            {/* Nút thêm ảnh */}
            <div style={styles.addImageBox} onClick={() => imageInputRef.current.click()}>
              <span style={styles.addImageIcon}>+</span>
              <span style={styles.addImageText}>画像を追加</span>
            </div>

            {/* Danh sách ảnh đã tải lên */}
            {images.map(image => (
              <div 
                key={image.id} 
                style={styles.imageWrapper}
                onMouseEnter={() => setHoveredImageId(image.id)}
                onMouseLeave={() => setHoveredImageId(null)}
              >
                {/* Bức ảnh gốc */}
                <img 
                  src={image.imageUrl} 
                  alt="Cafe" 
                  style={styles.imageItem} 
                />
                
                {/* Lớp mặt nạ và 2 nút bấm (Chỉ hiện khi lính canh nhận diện đúng ID) */}
                {hoveredImageId === image.id && (
                  <div style={styles.imageOverlay}>
                    {/* Nút phóng to (Ký hiệu ⛶) */}
                    <button style={styles.imageActionBtn}
                      onClick={() => setZoomedImageUrl(image.imageUrl)}
                    >
                      ⛶
                    </button>

                    {/* Nút Xóa (Ký hiệu ✖, chữ đỏ cho nguy hiểm) */}
                    <button style={{ ...styles.imageActionBtn, color: '#ea4335' }}
                      onClick={() => handleDeleteImage(image.id)}
                    >
                      ✖
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ========================================= */}
        {/* KHỐI 4: QUẢN LÝ KHUYẾN MÃI (割引・プロモーション管理) */}
        {/* ========================================= */}
        <div style={styles.card}>
          <div style={styles.couponHeader}>
            <h2 style={styles.sectionTitle}>割引・プロモーション管理</h2>
            <button style={styles.createCouponBtn} onClick={() => setShowCouponModal(true)}>
              + クーポン作成
            </button>
          </div>

          <div style={styles.couponList}>
            {coupons.map(coupon => (
              <div key={coupon.id} style={styles.couponCard}>
                
                {/* Cột trái: Tên, Mô tả & Ngày tháng */}
                <div style={styles.couponInfo}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <p style={styles.couponTitle}>{coupon.code || 'SALE'}</p>
                    {/* Giả sử ngài có trường description, nếu tên trường khác ngài tự đổi nhé */}
                    <span style={{ fontSize: '14px', color: '#666' }}>
                      {coupon.description || 'Giảm giá cho khách hàng'}
                    </span>
                  </div>
                  <p style={styles.couponDate}>
                    {formatDate(coupon.validFrom)} - {formatDate(coupon.validTo)}
                  </p>
                </div>
                
                {/* Cột phải: Trạng thái & Nút xóa */}
                <div style={styles.couponActions}>
                  <span style={styles.validBadge}>{coupon.status || '有効'}</span>
                  <button style={styles.deleteCouponBtn}
                    onClick={() => handleDeleteCoupon(coupon.id)}
                  >
                    🗑️
                  </button>
                </div>
                
              </div>
            ))}
          </div>
        </div>
      </main>
      {zoomedImageUrl && (
        <div 
          style={styles.fullscreenModal} 
          onClick={handleCloseZoomModal} 
          onWheel={handleWheelZoom} // 👈 Bùa chú bắt tín hiệu lăn chuột
        >
          {/* Nút X thoát */}
          <button style={styles.closeModalBtn}>✖</button>
          
          <img 
            src={zoomedImageUrl} 
            alt="Zoomed Cafe" 
            style={{ 
              ...styles.zoomedImage, 
              transform: `scale(${imageScale})`, // 👈 Ép kích thước theo biến imageScale
              transition: 'transform 0.1s ease-out' // 👈 Thêm hiệu ứng đàn hồi cho mượt
            }} 
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
      {showCouponModal && (
        <div style={styles.fullscreenModal}>
          <div style={styles.formModalCard}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>クーポン作成 (Tạo Khuyến Mãi)</h3>
            
            <label style={styles.formLabel}>Mã Code (Code)*</label>
            <input 
              style={styles.formInput} 
              type="text" 
              placeholder="VD: SUMMER2026"
              value={couponForm.code} 
              onChange={e => setCouponForm({...couponForm, code: e.target.value})} 
            />

            <label style={styles.formLabel}>Mô tả (Description)</label>
            <input 
              style={styles.formInput} 
              type="text" 
              placeholder="VD: Giảm giá mùa hè cho thức uống"
              value={couponForm.description} 
              onChange={e => setCouponForm({...couponForm, description: e.target.value})} 
            />

            <label style={styles.formLabel}>Giá trị giảm (Discount Value)*</label>
            <input 
              style={styles.formInput} 
              type="number" 
              placeholder="VD: 20000"
              value={couponForm.discountValue} 
              onChange={e => setCouponForm({...couponForm, discountValue: e.target.value})} 
            />

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={styles.formLabel}>Từ ngày (Valid From)*</label>
                <input 
                  style={styles.formInput} 
                  type="date" 
                  value={couponForm.validFrom} 
                  onChange={e => setCouponForm({...couponForm, validFrom: e.target.value})} 
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.formLabel}>Đến ngày (Valid To)*</label>
                <input 
                  style={styles.formInput} 
                  type="date" 
                  value={couponForm.validTo} 
                  onChange={e => setCouponForm({...couponForm, validTo: e.target.value})} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button 
                style={{ ...styles.popupBtn, backgroundColor: '#ccc', color: '#333' }} 
                onClick={() => setShowCouponModal(false)}
              >
                Hủy
              </button>
              <button 
                style={styles.popupBtn} 
                onClick={handleCreateCoupon}
              >
                Tạo Vé
              </button>
            </div>
          </div>
        </div>
      )}
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
  },
  // 👇 THÊM CÁC STYLE NÀY VÀO CUỐI ĐỐI TƯỢNG styles 👇
  
  // -- Style cho Quản lý Ảnh --
  imageContainer: {
    display: 'flex',
    gap: '16px',
    overflowX: 'auto',
    padding: '10px 0'
  },
  addImageBox: {
    width: '150px',
    height: '150px',
    border: '2px dashed #ff4d4f', // Viền nét đứt màu đỏ đô
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    backgroundColor: '#fffaf8',
    flexShrink: 0 // Chống bị bóp méo khi màn hình nhỏ
  },
  addImageIcon: {
    fontSize: '32px',
    color: '#ff4d4f',
    fontWeight: 'bold'
  },
  addImageText: {
    fontSize: '14px',
    color: '#666',
    marginTop: '8px'
  },
  imageItem: {
    width: '150px',
    height: '150px',
    borderRadius: '8px',
    objectFit: 'cover',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    flexShrink: 0
  },

  // -- Style cho Quản lý Khuyến mãi --
  couponHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  createCouponBtn: {
    backgroundColor: '#6b5744', // Màu nâu cà phê sang trọng
    color: '#fff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  couponList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  couponCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    border: '1px solid #eaeaea',
    borderRadius: '8px',
    backgroundColor: '#fff'
  },
  couponInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  couponTitle: {
    fontWeight: 'bold',
    fontSize: '16px',
    color: '#333',
    margin: 0
  },
  couponDate: {
    fontSize: '12px',
    color: '#999',
    margin: 0
  },
  couponActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  validBadge: {
    backgroundColor: '#e6f4ea', // Nền xanh nhạt
    color: '#34a853',           // Chữ xanh đậm
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  deleteCouponBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    color: '#999'
  },
  // 👇 THÊM/SỬA CÁC STYLE CHO ẢNH TẠI ĐÂY 👇

  // Khung chứa ảnh: Đóng vai trò làm mỏ neo để lớp mặt nạ bám vào
  imageWrapper: {
    position: 'relative', 
    width: '150px',
    height: '150px',
    flexShrink: 0,
    borderRadius: '8px',
    overflow: 'hidden', // Để mặt nạ không bị tràn ra ngoài góc bo tròn
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  // Lớp rèm đen mờ phủ lên trên bức ảnh
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Màu đen độ trong suốt 50%
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px', // Khoảng cách giữa 2 nút bấm
    transition: 'all 0.3s ease' // Hiệu ứng xuất hiện mượt mà
  },
  
  // Hình dáng của 2 nút bấm trên mặt nạ
  imageActionBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Nút màu trắng trong
    color: '#333',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  },
  // 👇 THÊM STYLES CHO MODAL PHÓNG TO ẢNH 👇

  // Phủ đen toàn bộ màn hình, luôn nằm trên cùng (zIndex: 9999)
  fullscreenModal: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.85)', // Đen mờ 85%
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999, 
    cursor: 'zoom-out' // Chuột biến thành kính lúp dấu trừ khi trỏ ra ngoài
  },
  
  // Nút X thoát ở góc phải
  closeModalBtn: {
    position: 'absolute',
    top: '30px',
    right: '40px',
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: '40px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'color 0.2s'
  },
  
  // Bức ảnh trung tâm
  zoomedImage: {
    maxWidth: '90%', // Chiều rộng tối đa 90% màn hình
    maxHeight: '90%', // Chiều cao tối đa 90% màn hình
    objectFit: 'contain', // Đảm bảo ảnh không bị méo
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
    cursor: 'default' // Trỏ vào ảnh thì chuột trở lại bình thường
  },
  // 👇 STYLES CHO FORM TẠO KHUYẾN MÃI 👇
  formModalCard: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '12px',
    width: '400px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    display: 'flex',
    flexDirection: 'column'
  },
  formLabel: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#555',
    marginBottom: '6px'
  },
  formInput: {
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    marginBottom: '16px',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box' // Đảm bảo input không bị tràn lề
  },
};

export default OwnerDashboardPage;