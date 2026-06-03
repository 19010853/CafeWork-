import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { t } from '../../utils/i18n';
import styles from './VerifyOtpCard.module.css';
import api from '../../api/axiosClient';

const VerifyOtpCard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      toast.error(t('otpValidationError'));
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/signup/verify', {
        email,
        otpCode,
      });

      if (response.status === 200) {
        const data = response.data;
        toast.success(t('signupCompleted'));
        
        // Save token and user info
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('fullName', data.fullName);
        localStorage.setItem('user', JSON.stringify(data));
        
        // Redirect to Home
        if(data.role === 'OWNER') {
          navigate('/owner/dashboard');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      const errorMsg = err.response?.data;
      toast.error(typeof errorMsg === 'string' ? errorMsg : t('verificationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>{t('otpTitle')}</h2>
      <p className={styles.subtitle}>
        {t('otpInstruction')}{' '}
        <span className={styles.emailHighlight}>
          {email}
        </span>
      </p>

      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.label}>{t('otpCode')}</label>
          <input
            type="text"
            maxLength="6"
            className={styles.input}
            placeholder="000000"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
            autoFocus
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={styles.submitButton}
        >
          {loading ? t('processing') : t('verify')}
        </button>
      </form>

      <div className={styles.footer}>
        <button type="button" className={styles.resendLink} onClick={() => navigate('/signup')}>
          ← {t('backToSignup')}
        </button>
      </div>
    </div>
  );
};

export default VerifyOtpCard;
