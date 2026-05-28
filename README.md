Hướng dẫn thiết lập môi trường ReactJS (Vite) & Bản đồ Leaflet
Tài liệu này hướng dẫn cách khởi tạo dự án ReactJS kết hợp bản đồ Leaflet một cách ổn định nhất. Lưu ý quan trọng: Chúng ta sẽ sử dụng thư viện leaflet thuần túy kết hợp React Hook, KHÔNG sử dụng react-leaflet để tránh lỗi xung đột phiên bản "Invalid hook call" với React 19.

Bước 1: Yêu cầu hệ thống
Đảm bảo máy tính của bạn đã cài đặt Node.js (Khuyên dùng bản LTS).
Kiểm tra bằng cách mở Terminal và gõ:

node -v

npm -v


Bước 2: Khởi tạo dự án bằng Vite

npm install vite


Bước 3: Cài đặt thư viện
Chúng ta chỉ cài đặt thư viện bản đồ cốt lõi leaflet:

npm install leaflet


Bước 4: cài đặt cơ chế chỉ đường của leaflet

npm install leaflet-routing-machine


Cài đặt thư viện để hiển thị thông báo

npm install react-hot-toast react-router-dom axios

Bước 5: cd qua cafework-frontend

Chạy npm run dev



