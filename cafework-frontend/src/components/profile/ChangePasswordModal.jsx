import React, { useState } from 'react';
import toast from 'react-hot-toast';
import styles from './ChangePasswordModal.module.css';
import axiosClient from '../../api/axiosClient';
import { t } from '../../utils/i18n';
const ChangePasswordModal = ({ isOpen, onClose }) => {
    const [form, setForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleClose = () => {
        setForm({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        });
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate
        if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
            toast.error(t('requiredFields'));
            return;
        }

        if (form.newPassword !== form.confirmPassword) {
            toast.error(t('passwordMismatch'));
            return;
        }

        // Độ mạnh mật khẩu (giống backend yêu cầu)
        const passwordRegex = /^(?=.*[A-Z])(?=.*[\d!@#$%^&*])(?=.{8,}).*$/;
        if (!passwordRegex.test(form.newPassword)) {
            toast.error(t('newPasswordError'));
            return;
        }

        setIsLoading(true);
        try {
            await axiosClient.post('/auth/change-password', {
                currentPassword: form.currentPassword,
                newPassword: form.newPassword
            });
            toast.success(t('changePasswordSuccess'));
            handleClose();
        } catch (error) {
            console.error("Lỗi đổi mật khẩu:", error);
            const errorMsg = error.response?.data || t('changePasswordFailed');
            toast.error(typeof errorMsg === 'string' ? errorMsg : t('unexpectedError'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={handleClose}>
            <div className={styles.card} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>{t('changePassword')}</h2>
                    <button className={styles.closeX} onClick={handleClose}>&times;</button>
                </div>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>{t('currentPassword')}</label>
                        <input
                            type="password"
                            className={styles.input}
                            value={form.currentPassword}
                            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                            disabled={isLoading}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>{t('newPassword')}</label>
                        <input
                            type="password"
                            className={styles.input}
                            value={form.newPassword}
                            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                            disabled={isLoading}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>{t('confirmPassword')}</label>
                        <input
                            type="password"
                            className={styles.input}
                            value={form.confirmPassword}
                            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                            disabled={isLoading}
                        />
                    </div>

                    <button 
                        type="submit" 
                        className={styles.submitBtn}
                        disabled={isLoading}
                    >
                        {isLoading ? t('processing') : t('changePassword')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordModal;
