import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { profileService } from '../../api/profileService';
import ChangePasswordModal from '../../components/profile/ChangePasswordModal';
import { getLang, getPhoneLocal, setPhoneLocal } from '../../utils/userLocalStore';
import { confirmToast } from '../../utils/confirmToast';
import styles from './ProfilePage.module.css';

const getInitial = (text) => {
    const value = (text || '').trim();
    return value ? value.charAt(0).toUpperCase() : 'U';
};

const getErrorMessage = (error) => {
    const data = error?.response?.data;
    if (typeof data === 'string' && data.trim()) return data;
    return error?.message || 'エラーが発生しました。';
};

const ProfilePage = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const lang = useMemo(() => getLang(), []);
    const isVi = lang === 'VI';

    const [loading, setLoading] = useState(Boolean(token));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [profile, setProfile] = useState(null);
    const [form, setForm] = useState({
        fullName: '',
        phone: '',
    });
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    const isOwner = useMemo(() => {
        const role = profile?.role || localStorage.getItem('role');
        return role === 'OWNER';
    }, [profile?.role]);

    useEffect(() => {
        if (!token) {
            setLoading(false);
            return;
        }

        let cancelled = false;
        (async () => {
            setLoading(true);
            setError('');
            try {
                const data = await profileService.getMyProfile();
                if (cancelled) return;
                setProfile(data);
                setForm({
                    fullName: data?.fullName || '',
                    phone: data?.phone || getPhoneLocal() || '',
                });
            } catch (err) {
                if (cancelled) return;
                setError(getErrorMessage(err));
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [token]);

    const handleLogout = () => {
        const message = lang === 'VI' ? 'Bạn có chắc muốn đăng xuất không?' : 'ログアウトしますか？';
        const cancelText = lang === 'VI' ? 'Hủy' : 'キャンセル';
        const confirmText = lang === 'VI' ? 'Đăng xuất' : 'ログアウト';

        confirmToast({
            message,
            cancelText,
            confirmText,
            onConfirm: () => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('role');
                localStorage.removeItem('fullName');
                navigate('/');
                window.location.reload();
            },
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation logic
        const trimmedName = form.fullName.trim();
        if (!trimmedName) {
            toast.error(isVi ? 'Vui lòng nhập họ tên.' : '名前を入力してください。');
            return;
        }
        if (trimmedName.length < 2 || trimmedName.length > 50) {
            toast.error(isVi ? 'Họ tên phải từ 2 đến 50 ký tự.' : '名前は2〜50文字で入力してください。');
            return;
        }
        const namePattern = /^[\p{L}]+([\p{L} .'-]*[\p{L}]+)?$/u;
        if (!namePattern.test(trimmedName) || /\d/.test(trimmedName)) {
            toast.error(isVi ? 'Họ tên chỉ được chứa chữ cái, không có số hoặc ký tự đặc biệt.' : '名前は文字のみで入力してください（数字や記号は不可）。');
            return;
        }
        if (trimmedName.includes('@')) {
            toast.error(isVi ? 'Họ tên không được chứa email.' : '名前にメールアドレスは使用できません。');
            return;
        }
        if (!form.phone.trim()) {
            toast.error(isVi ? 'Vui lòng nhập số điện thoại.' : '電話番号を入力してください。');
            return;
        }
        if (!/^\d+$/.test(form.phone)) {
            toast.error(isVi ? 'Số điện thoại chỉ gồm chữ số.' : '電話番号は数字のみで入力してください。');
            return;
        }

        if (!token) {
            toast.error(isVi ? 'Bạn cần đăng nhập.' : 'ログインが必要です。');
            navigate('/login');
            return;
        }

        setSaving(true);
        setError('');
        try {
            await profileService.updateMyProfile({
                fullName: trimmedName,
                phone: form.phone,
            });

            setPhoneLocal(form.phone);

            // Cập nhật localStorage để Header hiển thị tên mới ngay lập tức
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    localStorage.setItem('user', JSON.stringify({ ...user, fullName: trimmedName }));
                } catch {
                    // ignore
                }
            }
            localStorage.setItem('fullName', trimmedName);

            setProfile((prev) => (prev ? { ...prev, fullName: trimmedName } : prev));
            toast.success(isVi ? 'Đã cập nhật hồ sơ.' : 'プロフィールを更新しました。');
        } catch (err) {
            const msg = getErrorMessage(err);
            const fallback = isVi ? 'Cập nhật hồ sơ thất bại.' : 'プロフィール更新に失敗しました。';
            setError(isVi ? fallback : msg);
            toast.error(isVi ? fallback : msg);
        } finally {
            setSaving(false);
        }
    };

    if (!token) {
        return (
            <div className={styles.centerWrap}>
                <div className={`${styles.card} ${styles.messageCard}`}>
                    <h1 className={styles.pageTitle}>プロフィール</h1>
                    <p className={styles.subText}>
                        Hồ sơ chỉ hiển thị sau khi bạn đăng nhập.
                    </p>
                    <div className={styles.actions}>
                        <button
                            type="button"
                            className={styles.primaryButton}
                            onClick={() => navigate('/login')}
                        >
                            ログインへ
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className={styles.centerWrap}>
                <div className={`${styles.card} ${styles.messageCard}`}>
                    <h1 className={styles.pageTitle}>読み込み中...</h1>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className={styles.page}>
                <div className={styles.container}>
                    <aside className={styles.sidebar}>
                        <div className={`${styles.card} ${styles.profileCard}`}>
                            <div className={styles.avatar}>
                                {getInitial(profile?.fullName || profile?.email)}
                            </div>
                            <h2 className={styles.name}>{profile?.fullName || 'ユーザー'}</h2>
                            <p className={styles.subText}>{profile?.email}</p>
                            <span className={styles.roleBadge}>
                                {profile?.role === 'OWNER' ? 'OWNER / オーナー' : 'USER / ユーザー'}
                            </span>
                        </div>

                        <div className={`${styles.card} ${styles.menuCard}`}>
                            <button
                                type="button"
                                className={`${styles.menuButton} ${styles.menuButtonActive}`}
                            >
                                プロフィール編集
                            </button>
                            <button
                                type="button"
                                className={styles.menuButton}
                                onClick={() => setIsPasswordModalOpen(true)}
                            >
                                パスワード変更
                            </button>
                            <button
                                type="button"
                                className={`${styles.menuButton} ${styles.menuButtonDanger}`}
                                onClick={handleLogout}
                            >
                                ログアウト
                            </button>
                        </div>
                    </aside>

                    <main className={styles.main}>
                        <div className={`${styles.card} ${styles.mainCard}`}>
                            <h1 className={styles.pageTitle}>基本情報</h1>

                            {error && (
                                <p className={styles.errorText}>{error}</p>
                            )}

                            <form className={styles.form} onSubmit={handleSubmit}>
                                <div className={styles.formRow}>
                                    <div className={styles.labelRow}>
                                        <label className={styles.label} htmlFor="fullName">
                                            お名前
                                        </label>
                                        <span className={styles.required}>*</span>
                                    </div>
                                    <input
                                        id="fullName"
                                        className={styles.input}
                                        value={form.fullName}
                                        onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                                        placeholder="Tên của bạn"
                                    />
                                </div>

                                <div className={styles.formRow}>
                                    <label className={styles.label} htmlFor="email">
                                        メールアドレス
                                    </label>
                                    <input
                                        id="email"
                                        className={`${styles.input} ${styles.inputDisabled}`}
                                        value={profile?.email || ''}
                                        disabled
                                        readOnly
                                    />
                                </div>

                                <div className={styles.formRow}>
                                    <div className={styles.labelRow}>
                                        <label className={styles.label} htmlFor="phone">
                                            電話番号
                                        </label>
                                        <span className={styles.required}>*</span>
                                    </div>
                                    <input
                                        id="phone"
                                        className={styles.input}
                                        value={form.phone}
                                        onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                                        placeholder="Số điện thoại"
                                    />
                                </div>

                                <div className={styles.actions}>
                                    <button
                                        type="button"
                                        className={styles.secondaryButton}
                                        onClick={() => navigate('/')}
                                        disabled={saving}
                                    >
                                        戻る
                                    </button>
                                    <button
                                        type="submit"
                                        className={styles.primaryButton}
                                        disabled={saving}
                                    >
                                        {saving ? '更新中...' : '更新する'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </main>
                </div>
            </div>
            <ChangePasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
            />
        </>
    );
};

export default ProfilePage;
