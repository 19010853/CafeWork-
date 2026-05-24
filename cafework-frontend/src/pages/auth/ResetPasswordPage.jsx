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
            newErrors.newPassword = 'Mật khẩu mới không được để trống';
        } else if (!passwordRegex.test(form.newPassword)) {
            newErrors.newPassword = 'Mật khẩu phải tối thiểu 8 ký tự, gồm chữ hoa và số/ký tự đặc biệt';
        }

        if (form.confirmPassword !== form.newPassword) {
            newErrors.confirmPassword = 'Xác nhận mật khẩu không khớp';
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
            toast.success('Đặt lại mật khẩu thành công!');
            navigate('/login');
        } catch (error) {
            toast.error(error?.response?.data || 'Đặt lại mật khẩu thất bại');
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
