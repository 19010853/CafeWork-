import React, { useState } from 'react';
import toast from 'react-hot-toast';
import styles from './ChangePasswordModal.module.css';

const ChangePasswordModal = ({ isOpen, onClose }) => {
    const [form, setForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const validate = () => {
        const newErrors = {};
        if (!form.currentPassword) {
            newErrors.currentPassword = 'Mật khẩu hiện tại không được để trống';
        }
        
        // Password regex: ít nhất 8 ký tự, có chữ hoa, số hoặc ký tự đặc biệt
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
            // Logic gọi API đổi mật khẩu sẽ ở đây (giả lập thành công)
            // await profileService.changePassword(form);
            toast.success('Đổi mật khẩu thành công!');
            onClose();
        } catch (error) {
            toast.error(error?.response?.data || 'Đổi mật khẩu thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Đổi mật khẩu</h2>
                    <button className={styles.closeBtn} onClick={onClose}>&times;</button>
                </div>
                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Mật khẩu hiện tại</label>
                        <input
                            type="password"
                            className={`${styles.input} ${errors.currentPassword ? styles.inputError : ''}`}
                            value={form.currentPassword}
                            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                        />
                        {errors.currentPassword && <span className={styles.errorText}>{errors.currentPassword}</span>}
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Mật khẩu mới</label>
                        <input
                            type="password"
                            className={`${styles.input} ${errors.newPassword ? styles.inputError : ''}`}
                            value={form.newPassword}
                            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
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
                        />
                        {errors.confirmPassword && <span className={styles.errorText}>{errors.confirmPassword}</span>}
                    </div>

                    <div className={styles.actions}>
                        <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={loading}>
                            Hủy
                        </button>
                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordModal;
