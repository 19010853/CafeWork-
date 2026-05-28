import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import styles from './LoginCard.module.css';
import api from '../../api/axiosClient';

const LoginCard = ({ onSwitchToSignup }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'メールアドレスを入力してください。';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください。';
    }
    if (!formData.password) {
      newErrors.password = 'パスワードを入力してください。';
    } else if (formData.password.length < 8) {
      newErrors.password = 'パスワードは8文字以上である必要があります。';
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
      const response = await api.post('/auth/login', formData);

      if (response.status === 200) {
        const data = response.data;
        toast.success('ログインに成功しました！');
        
        // Save token and user info
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('fullName', data.fullName);
        localStorage.setItem('user', JSON.stringify(data));
        if(response.data.cafeId) {
          localStorage.setItem('cafeId', response.data.cafeId);
        }
        if (data.role === 'OWNER') {
          navigate('/owner/dashboard'); // Cổng VIP phi thẳng vào Điện điều hành
        } else {
          navigate('/'); // Cổng thường dành cho bách tính
        }
      }
    } catch (err) {
      const errorMsg = err.response?.data || 'ログインに失敗しました。';
      toast.error(typeof errorMsg === 'string' ? errorMsg : 'ログインに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>ログイン</h2>
      
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label className={styles.label}>メールアドレス</label>
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
          <label className={styles.label}>パスワード</label>
          <input
            type="password"
            className={`${styles.input} ${errors.password ? styles.inputError : ''}`}
            placeholder="********"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          {errors.password && <p className={styles.errorMessage}>{errors.password}</p>}
        </div>

        <div className={styles.links}>
          <a href="#" className={styles.link}>
            パスワードを<span className={styles.linkStrong}>お忘れですか？</span>
          </a>
          <button 
            type="button" 
            onClick={onSwitchToSignup}
            className={styles.link}
          >
            アカウント<span className={styles.linkStrong}>作成</span>
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={styles.submitButton}
        >
          {loading ? '処理中...' : 'ログイン'}
        </button>
      </form>
    </div>
  );
};

export default LoginCard;
