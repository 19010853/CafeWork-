import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import styles from './SignupCard.module.css';
import api from '../../api/axiosClient';
import { t } from '../../utils/i18n';

const SignupCard = ({ onSwitchToLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'USER',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName) newErrors.fullName = t('nameRequired');
    if (!formData.email) {
      newErrors.email = t('emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('emailInvalid');
    }
    const passwordRegex = /^(?=.*[A-Z])(?=.*[\d!@#$%^&*])(?=.{8,})/;
    if (!formData.password) {
      newErrors.password = t('passwordRequired');
    } else if (!passwordRegex.test(formData.password)) {
      newErrors.password = t('passwordInvalid');
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('passwordMismatch');
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/signup/initiate', {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        role: formData.role
      });

      if (response.status === 200) {
        toast.success(t('signupSuccess'));
        // Chuyển hướng sang trang nhập OTP, truyền kèm email
        navigate('/verify-otp', { state: { email: formData.email } });
      }
    } catch (err) {
      const errorMsg = err.response?.data || t('signupFailed');
      toast.error(typeof errorMsg === 'string' ? errorMsg : t('signupFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>
        {t('signup')}
      </h2>

      {/* Role Selection Tabs */}
      <div className={styles.roleToggle}>
        <button
          type="button"
          className={`${styles.roleButton} ${formData.role === 'USER' ? styles.roleButtonActive : ''}`}
          onClick={() => setFormData({ ...formData, role: 'USER' })}
        >
          {t('normalUser')}
        </button>
        <button
          type="button"
          className={`${styles.roleButton} ${formData.role === 'OWNER' ? styles.roleButtonActive : ''}`}
          onClick={() => setFormData({ ...formData, role: 'OWNER' })}
        >
          {t('cafeOwner')}
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.label}>{t('fullName')}</label>
          <input
            type="text"
            className={`${styles.input} ${errors.fullName ? styles.inputError : ''}`}
            placeholder="山田 太郎"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          />
          {errors.fullName && <p className={styles.errorMessage}>{errors.fullName}</p>}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>{t('email')}</label>
          <input
            type="email"
            className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
            placeholder="example@mail.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          {errors.email && <p className={styles.errorMessage}>{errors.email}</p>}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>{t('password')}</label>
          <input
            type="password"
            className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
            placeholder="********"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          {errors.password && <p className={styles.errorMessage}>{errors.password}</p>}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>{t('confirmPassword')}</label>
          <input
            type="password"
            className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
            placeholder="********"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          />
          {errors.confirmPassword && <p className={styles.errorMessage}>{errors.confirmPassword}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={styles.submitButton}
        >
          {loading ? t('processing') : t('signup')}
        </button>
      </form>

      <div className={styles.footer}>
        <button 
          type="button"
          onClick={onSwitchToLogin}
          className={styles.link}
        >
          {t('alreadyHaveAccount')} {t('backToLogin')}
        </button>
      </div>
    </div>
  );
};

export default SignupCard;
