import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './VerifyOtpPage.module.css';
import api from '../api/axiosClient';

const VerifyOtpPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const intent = location.state?.intent;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate('/signup');
    }
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      alert('Vui lòng nhập mã OTP gồm 6 chữ số.');
      return;
    }

    if (intent === 'RESET_PASSWORD') {
      // Luồng Reset Password: Chuyển tiếp sang trang nhập mật khẩu mới
      navigate('/reset-password', { state: { email: email, otpCode: otp } });
      return;
    }

    // Luồng Signup cũ: Giữ nguyên logic
    setLoading(true);
    try {
      const response = await api.post('/auth/signup/verify', {
        email: email,
        otpCode: otp,
      });

      if (response.status === 200) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data));
        navigate('/');
      }
    } catch (err) {
      const errorMsg = err.response?.data || 'Xác thực không thành công. Vui lòng thử lại.';
      alert(typeof errorMsg === 'string' ? errorMsg : 'Lỗi xác thực OTP');
    } finally {
      setLoading(false);
    }
  };

  if (!email) return null;

  return (
    <div className={styles.verifyContainer}>
      <main className={styles.mainContent}>
        <div className={styles.card}>
          <h2 className={styles.title}>Xác thực OTP</h2>
          <p className={styles.message}>
            Vui lòng nhập mã gồm 6 chữ số đã được gửi đến email của bạn.
          </p>

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <input
                type="text"
                maxLength="6"
                className={styles.input}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={styles.submitButton}
            >
              {loading ? 'Đang xử lý...' : 'Xác nhận'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default VerifyOtpPage;
