import React, { useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaUserCircle, FaHome, FaUserCog, FaBuilding } from 'react-icons/fa';
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react';
import '../../css/HeaderAi.css';
import AuthTokenReset from '../../auth/AuthTokenReset';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '../../contexts/UserRoleContext';

const HeaderAi = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  const { role } = useUserRole();
  const { user } = useUser(); // Lấy thông tin user

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountRef = useRef(null);

  return (
    <header className="header">
      <div className="header-ai-container">

        {/* Bỏ logo FPT và nav Trang chủ/Khám phá/Cá nhân hóa */}

        {role === 'admin' && isAdminPage && (
          <nav className="header-nav">
            <Link
              to="/admin/users"
              className={`header-nav-link ${location.pathname === '/admin/users' ? 'active' : ''}`}
            >
              Người dùng
            </Link>
            <Link
              to="/admin/businesses"
              className={`header-nav-link ${location.pathname === '/admin/businesses' ? 'active' : ''}`}
            >
              Doanh nghiệp
            </Link>
            <Link
              to="/admin/transactions"
              className={`header-nav-link ${location.pathname === '/admin/transactions' ? 'active' : ''}`}
            >
              Giao dịch
            </Link>
          </nav>
        )}

        <SignedOut>
          <AuthTokenReset />
          <div
            className="account-menu-wrapper"
            ref={accountRef}
            onClick={() => setShowAccountMenu((prev) => !prev)}
          >
            <FaUserCircle size={20} />
            <span>Tài khoản</span>
            {showAccountMenu && (
              <ul className="account-dropdown">
                <li>
                  <Link to="/login">Đăng nhập</Link>
                </li>
                <li>
                  <Link to="/signup">Đăng ký</Link>
                </li>
              </ul>
            )}
          </div>
        </SignedOut>

        <SignedIn>
          <div className="header-user-info">
            <UserButton userProfileUrl="/user-profile" appearance={{ elements: { userButtonAvatarBox: "avatar-box" } }} />
            <span className="header-username">{user?.fullName || user?.username}</span>
          </div>
        </SignedIn>
      </div>
    </header>
  );
};

export default HeaderAi;
