import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import styles from './ResetPasswordPage.module.css';
import api from '../../api/axiosClient';
import { t } from '../../utils/i18n';
const ResetPasswordPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;
    const otpCode = location.state?.otpCode;

    const [form, setForm] = useState({
        newPassword: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!email || !otpCode) {
            toast.error(t('invalidAuthInfo'));
            navigate('/login');
        }
    }, [email, otpCode, navigate]);

    const validate = () => {
        const newErrors = {};
        const passwordRegex = /^(?=.*[A-Z])(?=.*[\d!@#$%^&*])(?=.{8,})/;
        
        if (!form.newPassword) {
            newErrors.newPassword = t('newPasswordRequired');
        } else if (!passwordRegex.test(form.newPassword)) {
            newErrors.newPassword = t('passwordInvalid');
        }

        if (form.confirmPassword !== form.newPassword) {
            newErrors.confirmPassword = t('passwordMismatch');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            await api.post('/auth/reset-password', {
                email,
                otpCode,
                newPassword: form.newPassword
            });
            toast.success(t('passwordResetSuccess'));
            navigate('/login');
        } catch (error) {
            const errorMsg = error.response?.data || t('passwordResetFailed');
            toast.error(typeof errorMsg === 'string' ? errorMsg : t('passwordResetError'));
        } finally {
            setLoading(false);
        }
    };

    if (!email || !otpCode) return null;

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <h1 className={styles.title}>{t('resetPassword')}</h1>
                <p className={styles.subtitle}>{t('resetPasswordInstruction', { email })}</p>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>{t('newPassword')}</label>
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
                        <label className={styles.label}>{t('confirmPassword')}</label>
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
                        {loading ? t('processing') : t('resetPassword')}
                    </button>
                    
                    <button 
                        type="button" 
                        className={styles.backBtn}
                        onClick={() => navigate('/login')}
                    >
                        {t('backToLogin')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
