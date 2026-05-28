import { useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styles from './Header.module.css';
import { getLang, setLang as persistLang } from '../../utils/userLocalStore';
const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [langOpen, setLangOpen] = useState(false);

  const lang = useMemo(() => getLang(), []);
  const labels = useMemo(() => {
    if (lang === 'VI') {
      return {
        langLabel: 'VI Tiếng Việt',
        login: 'Đăng nhập',
        register: 'Đăng ký',
        profile: 'Hồ sơ',
        logout: 'Đăng xuất',
      };
    }

    return {
      langLabel: 'JP 日本語',
      login: 'ログイン',
      register: '登録',
      profile: 'プロフィール',
      logout: 'ログアウト',
    };
  }, [lang]);
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

  // 4. Hàm xử lý Đăng xuất
  const handleLogout = () => {
    if (window.confirm("ログアウトしますか？")) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      localStorage.removeItem('fullName');

      navigate('/');
      window.location.reload(); // Reload để cập nhật lại trạng thái giao diện toàn trang
    }
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
            <span className={styles.flag}>{lang === 'VI' ? '🇻🇳' : '🇯🇵'}</span>
            <span>{labels.langLabel}</span>
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
              {labels.login}
            </button>
            <button
              onClick={() => navigate('/signup')}
              className={styles.registerButton}
            >
              {labels.register}
            </button>
          </>
        ) : (
          /* Case 3: Logged-in User */
          <div className={styles.profileSection}>
            <Link
              to="/profile"
              className={styles.profileLink}
              aria-label={labels.profile}
              title={labels.profile}
            >
              <div className={styles.avatar}>
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <span className={styles.userName}>
                {user?.fullName || 'ユーザー'}
              </span>
            </Link>
            <button
              onClick={handleLogout}
              className={styles.logoutButton}
            >
              ⎋ {labels.logout}
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
                ダッシュボード
              </button>

              <button
                  className={isActive('/owner/management') ? styles.activeTab : styles.navTab}
                  onClick={() => navigate('/owner/management')} // Ngài có thể đổi link này tùy ý
              >
                店舗管理
              </button>
            </>
          ) : (
            /* --- 🧑‍🌾 GIAO DIỆN DÀNH CHO KHÁCH HÀNG (USER / KHÁCH VÃNG LAI) --- */
            <>
              <button
                  className={isActive('/') ? styles.activeTab : styles.navTab}
                  onClick={() => navigate('/')}
              >
                ホーム
              </button>

              <button
                  className={isActive('/my-list') ? styles.activeTab : styles.navTab}
                  onClick={() => navigate('/my-list')}
              >
                マイリスト
              </button>

              <button
                  className={isActive('/search-history') ? styles.activeTab : styles.navTab}
                  onClick={() => navigate('/search-history')}
              >
                検索履歴
              </button>
            </>
          )}

        </nav>
      </>
  );
};

export default Header;
