import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import HomePage from './pages/HomePage';
import CafeDetailPage from './pages/CafeDetailPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import VerifyOtpPage from './pages/VerifyOtpPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import OwnerDashboardPage from './pages/owner/OwnerDashboardPage';
import CafeManagementPage from './pages/owner/CafeManagementPage';
import ProfilePage from './pages/profile/ProfilePage';
import MyListPage from './pages/MyListPage';
import SearchHistoryPage from './pages/SearchHistoryPage';
import Header from './components/layout/Header';

const AppShell = () => {
  const location = useLocation();
  const hideHeaderPaths = ['/login', '/signup', '/verify-otp', '/forgot-password', '/reset-password'];
  const shouldHideHeader =
    hideHeaderPaths.includes(location.pathname);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2500,
          className: 'cw-toast',
          style: {
            maxWidth: 'min(420px, calc(100vw - 24px))',
          },
          error: {
            duration: 4000,
          },
        }}
      />
      {!shouldHideHeader && <Header />}
      <Routes>
        {/* Các route công khai */}
        <Route path="/" element={<HomePage />} />
        <Route path="/cafes/:id" element={<CafeDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Các route dành cho chủ quán (Owner) */}
        <Route path="/owner/dashboard" element={<OwnerDashboardPage />} />
        <Route path="/owner/cafe-management" element={<CafeManagementPage />} />

        {/* Route quản lý hồ sơ (Người dùng / Chủ quán) */}
        <Route path="/profile" element={<ProfilePage />} />

        {/* Tabs: My list + Search history */}
        <Route path="/my-list" element={<MyListPage />} />
        <Route path="/search-history" element={<SearchHistoryPage />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

export default App;
