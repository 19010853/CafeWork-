import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './VerifyOtpPage.module.css';
import api from '../api/axiosClient';
import { toast } from 'react-hot-toast';
import { t } from '../utils/i18n';
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
      toast.error(t('otpValidationError'));
      return;
    }

    if (intent === 'RESET_PASSWORD') {
      // Luồng Reset Password: Kiểm tra OTP trước khi chuyển sang trang đổi mật khẩu
      setLoading(true);
      try {
        await api.post('/auth/verify-otp', {
          email: email,
          otpCode: otp,
        });
        navigate('/reset-password', { state: { email: email, otpCode: otp } });
      } catch (err) {
        const errorMsg = err.response?.data || 'Xác thực không thành công. Vui lòng thử lại.';
        toast.error(typeof errorMsg === 'string' ? errorMsg : t('otpWrong'));
      } finally {
        setLoading(false);
      }
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
      toast.error(typeof errorMsg === 'string' ? errorMsg : t('otpWrong'));
    } finally {
      setLoading(false);
    }
  };

  if (!email) return null;

  return (
    <div className={styles.verifyContainer}>
      <main className={styles.mainContent}>
        <div className={styles.card}>
          <h2 className={styles.title}>{t('otpTitle')}</h2>
          <p className={styles.message}>
            {t('otpInstruction')}
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
              {loading ? t('verifing') : t('verify')}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default VerifyOtpPage;
