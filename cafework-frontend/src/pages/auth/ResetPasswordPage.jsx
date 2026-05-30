import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import styles from './ResetPasswordPage.module.css';

const ResetPasswordPage = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        newPassword: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const validate = () => {
        const newErrors = {};
        const passwordRegex = /^(?=.*[A-Z])(?=.*[\d!@#$%^&*])(?=.{8,})/;
        
        if (!form.newPassword) {
            newErrors.newPassword = '新しいパスワードを入力してください。';
        } else if (!passwordRegex.test(form.newPassword)) {
            newErrors.newPassword = 'パスワードは8文字以上で、大文字・数字・記号を含む必要があります。';
        }

        if (form.confirmPassword !== form.newPassword) {
            newErrors.confirmPassword = 'パスワードの確認が一致しません。';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            // Logic gọi API reset mật khẩu sẽ ở đây
            // await authService.resetPassword(form);
            toast.success('パスワードが正常にリセットされました！');
            navigate('/login');
        } catch (error) {
            toast.error(error?.response?.data || 'パスワードリセットに失敗しました。');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <h1 className={styles.title}>Đặt lại mật khẩu</h1>
                <p className={styles.subtitle}>Nhập mật khẩu mới cho tài khoản của bạn</p>
                
                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Mật khẩu mới</label>
                        <input
                            type="password"
                            className={`${styles.input} ${errors.newPassword ? styles.inputError : ''}`}
                            value={form.newPassword}
                            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                            placeholder="••••••••"
                        />
                        {errors.newPassword && <span className={styles.errorText}>{errors.newPassword}</span>}
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Xác nhận mật khẩu mới</label>
                        <input
                            type="password"
                            className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ''}`}
                            value={form.confirmPassword}
                            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                            placeholder="••••••••"
                        />
                        {errors.confirmPassword && <span className={styles.errorText}>{errors.confirmPassword}</span>}
                    </div>

                    <button type="submit" className={styles.submitBtn} disabled={loading}>
                        {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                    </button>
                    
                    <button 
                        type="button" 
                        className={styles.backBtn}
                        onClick={() => navigate('/login')}
                    >
                        Quay lại Đăng nhập
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
