import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import styles from './ForgotPasswordPage.module.css';
import axiosClient from '../../api/axiosClient';

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate định dạng email
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!email) {
            toast.error("Vui lòng nhập địa chỉ email.");
            return;
        }
        if (!emailRegex.test(email)) {
            toast.error("Định dạng email không hợp lệ.");
            return;
        }

        setIsLoading(true);
        try {
            // Gọi API gửi yêu cầu quên mật khẩu
            await axiosClient.post('/auth/forgot-password', { email });
            
            toast.success("Mã OTP đã được gửi!");
            
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
            toast.error(typeof errorMsg === 'string' ? errorMsg : "Gửi yêu cầu thất bại.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>Quên mật khẩu</h1>
                <p className={styles.description}>
                    Vui lòng nhập địa chỉ email đã đăng ký để nhận mã OTP đặt lại mật khẩu của bạn.
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
                        {isLoading ? "Đang xử lý..." : "Gửi mã OTP"}
                    </button>
                </form>

                <div className={styles.linkWrapper}>
                    <Link to="/login" className={styles.backLink}>
                        Quay lại Đăng nhập
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
