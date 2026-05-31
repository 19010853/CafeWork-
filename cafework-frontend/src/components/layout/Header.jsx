import { useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styles from './Header.module.css';
import { getLang, setLang as persistLang } from '../../utils/userLocalStore';
import { confirmToast } from '../../utils/confirmToast'; // Giữ lại bảng thông báo sang trọng của đại thần 1
import { t } from '../../utils/i18n'; // Kế thừa phép thuật đa ngôn ngữ của đại thần 2

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [langOpen, setLangOpen] = useState(false);

  const lang = useMemo(() => getLang(), []);
  
  // Hiển thị nhãn ngôn ngữ theo đúng 3 thứ tiếng
  const langLabel = {
    JP: 'JP 日本語',
    VI: 'VI Tiếng Việt',
    EN: 'EN English'
  }[lang] || 'JP 日本語';

  const isActive = (path) => location.pathname === path;

  // 1. Lấy token và thông tin user từ localStorage
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  let user = null;

  try {
    if (userStr) {
      user = JSON.parse(userStr);
    }
  } catch (error) {
    console.error('Error parsing user data:', error);
  }

  // 4. Hàm xử lý Đăng xuất (Đã dung hợp confirmToast và t('...'))
  const handleLogout = () => {
    confirmToast({
      message: t('confirmLogout'),
      // Fallback an toàn cho nút Hủy đề phòng file i18n chưa định nghĩa
      cancelText: lang === 'VI' ? 'Hủy' : (lang === 'EN' ? 'Cancel' : 'キャンセル'), 
      confirmText: t('logout'),
      onConfirm: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        localStorage.removeItem('fullName');

        navigate('/');
        window.location.reload(); // Reload để cập nhật lại trạng thái giao diện toàn trang
      },
    });
  };

  const handleSelectLang = (nextLang) => {
    persistLang(nextLang);
    setLangOpen(false);
    window.location.reload();
  };

  const userRole = localStorage.getItem('role');
  
  return (
    <>
      <header className={styles.header}>
        {/* Left: Language Selection */}
        <div className={styles.leftSection}>
          <div className={styles.languageWrap}>
            <button
              type="button"
              className={styles.languageDropdown}
              onClick={() => setLangOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={langOpen}
            >
              <span className={styles.flag}>
                {{
                  JP: '🇯🇵',
                  VI: '🇻🇳',
                  EN: '🇺🇸'
                }[lang]}
              </span>
              <span>{langLabel}</span>
              <svg className={styles.arrowIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {langOpen && (
              <div className={styles.langMenu} role="menu">
                <button type="button" className={styles.langMenuItem} role="menuitem" onClick={() => handleSelectLang('JP')}>
                  🇯🇵 JP 日本語
                </button>
                <button type="button" className={styles.langMenuItem} role="menuitem" onClick={() => handleSelectLang('VI')}>
                  🇻🇳 VI Tiếng Việt
                </button>
                <button type="button" className={styles.langMenuItem} role="menuitem" onClick={() => handleSelectLang('EN')}>
                  🇺🇸 EN English
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Middle: Logo */}
        <div className={styles.centerSection}>
          <Link to="/" className={styles.logo}>
            ☕カフェワーク
          </Link>
        </div>

        {/* Right Section: Conditional Rendering based on Auth State */}
        <div className={styles.rightSection}>
          {!token ? (
            /* Case 2: Guest (Not logged in) */
            <>
              <button
                onClick={() => navigate('/login')}
                className={styles.loginButton}
              >
                {t('login')}
              </button>
              <button
                onClick={() => navigate('/signup')}
                className={styles.registerButton}
              >
                {t('register')}
              </button>
            </>
          ) : (
            /* Case 3: Logged-in User */
            <div className={styles.profileSection}>
              <Link
                to="/profile"
                className={styles.profileLink}
                aria-label={t('profile')}
                title={t('profile')}
              >
                <div className={styles.avatar}>
                  {user?.fullName?.charAt(0) || 'U'}
                </div>
                <span className={styles.userName}>
                  {user?.fullName || t('user')}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className={styles.logoutButton}
              >
                ⎋ {t('logout')}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* GLOBAL NAVIGATION */}
      <nav className={styles.navTabs}>
        
        {userRole === 'OWNER' ? (
          /* --- 👑 GIAO DIỆN DÀNH RIÊNG CHO CHỦ QUÁN (OWNER) --- */
          <>
            <button
              className={isActive('/owner/dashboard') ? styles.activeTab : styles.navTab}
              onClick={() => navigate('/owner/dashboard')}
            >
              {t('dashboard')}
            </button>

            <button
              className={isActive('/owner/management') ? styles.activeTab : styles.navTab}
              onClick={() => navigate('/owner/management')}
            >
              {t('storeManagement')}
            </button>
          </>
        ) : (
          /* --- 🧑‍🌾 GIAO DIỆN DÀNH CHO KHÁCH HÀNG (USER / KHÁCH VÃNG LAI) --- */
          <>
            <button
              className={isActive('/') ? styles.activeTab : styles.navTab}
              onClick={() => navigate('/')}
            >
              {t('home')}
            </button>

            <button
              className={isActive('/my-list') ? styles.activeTab : styles.navTab}
              onClick={() => navigate('/my-list')}
            >
              {t('myList')}
            </button>

            <button
              className={isActive('/search-history') ? styles.activeTab : styles.navTab}
              onClick={() => navigate('/search-history')}
            >
              {t('searchHistory')}
            </button>
          </>
        )}

      </nav>
    </>
  );
};

export default Header;