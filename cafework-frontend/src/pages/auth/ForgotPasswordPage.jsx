import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import styles from './ForgotPasswordPage.module.css';
import axiosClient from '../../api/axiosClient';
import { t } from '../../utils/i18n';
const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate định dạng email
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!email) {
            toast.error(t('emailRequired'));
            return;
        }
        if (!emailRegex.test(email)) {
            toast.error(t('emailInvalid'));
            return;
        }

        setIsLoading(true);
        try {
            // Gọi API gửi yêu cầu quên mật khẩu
            await axiosClient.post('/auth/forgot-password', { email });
            
            toast.success(t('otpSent'));
            
            // Chuyển hướng sang trang xác thực OTP kèm theo email và intent
            navigate('/verify-otp', { 
                state: { 
                    email: email, 
                    intent: 'RESET_PASSWORD' 
                } 
            });
        } catch (error) {
            console.error("Lỗi khi gửi yêu cầu quên mật khẩu:", error);
            const errorMsg = error.response?.data || "Có lỗi xảy ra, vui lòng thử lại sau.";
            toast.error(typeof errorMsg === 'string' ? errorMsg : t('forgotPasswordFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>{t('forgotPassword')}</h1>
                <p className={styles.description}>
                    {t('forgotPasswordInstruction')}
                </p>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.label} htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            className={styles.input}
                            placeholder="example@mail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    <button 
                        type="submit" 
                        className={styles.submitBtn}
                        disabled={isLoading}
                    >
                        {isLoading ? t('processing') : t('sendOtp')}
                    </button>
                </form>

                <div className={styles.linkWrapper}>
                    <Link to="/login" className={styles.backLink}>
                        {t('backToLogin')}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
