import React, { useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaUserCircle, FaHome, FaUserCog, FaBuilding } from 'react-icons/fa';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import '../css/Header.css';
import AuthTokenReset from '../auth/AuthTokenReset';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '../contexts/UserRoleContext';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  const { role } = useUserRole();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountRef = useRef(null);

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <Link to="/">
            <img
              src="/Logo_FPT_Education.png"
              alt="FPT Education Logo"
              className="header-logo"
            />
          </Link>
        </div>

        {role === 'admin' && isAdminPage ? (
          <nav className="header-nav">
            <Link
              to="/admin/users"
              className={`header-nav-link ${location.pathname === '/admin/users' ? 'active' : ''
                }`}
            >
              Người dùng
            </Link>
            <Link
              to="/admin/businesses"
              className={`header-nav-link ${location.pathname === '/admin/businesses' ? 'active' : ''
                }`}
            >
              Doanh nghiệp
            </Link>
            <Link
              to="/admin/transactions"
              className={`header-nav-link ${location.pathname === '/admin/transactions' ? 'active' : ''
                }`}
            >
              Giao dịch
            </Link>
          </nav>
        ) : (
          <nav className={`header-nav ${isMenuOpen ? 'active' : ''}`}>
            <Link
              to="/"
              className={`header-nav-link ${location.pathname === '/' ? 'active' : ''
                }`}
            >
              Trang chủ
            </Link>
            <Link
              to="/discover"
              className={`header-nav-link ${location.pathname.startsWith('/discover') ? 'active' : ''
                }`}
            >
              Khám phá
            </Link>
            <Link
              to="/personalized"
              className={`header-nav-link ${location.pathname === '/personalized' ? 'active' : ''
                }`}
            >
              Cá nhân hóa
            </Link>
            {role === 'owner' && (
              <Link
                to="/my-business"
                className={`header-nav-link ${location.pathname === '/my-business' ? 'active' : ''
                  }`}
              >
                Doanh nghiệp của tôi
              </Link>
            )}

            {role === 'client' && (
              <Link
                to="/business-registration"
                className={`header-nav-link ${location.pathname === '/business-registration' ? 'active' : ''
                  }`}
              >
                Đăng ký doanh nghiệp
              </Link>
            )}
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
            <UserButton userProfileUrl="/user-profile">
              {role === 'admin' && !isAdminPage && (
                <UserButton.MenuItems>
                  <UserButton.Action
                    label="Quản trị hệ thống"
                    labelIcon={<FaUserCog />}
                    onClick={() => navigate('/admin/users')}
                  />
                </UserButton.MenuItems>
              )}
              {role === 'admin' && isAdminPage && (
                <UserButton.MenuItems>
                  <UserButton.Action
                    label="Trang chủ"
                    labelIcon={<FaHome />}
                    onClick={() => navigate('/')}
                  />
                </UserButton.MenuItems>
              )}
              {role === 'owner' && (
                <UserButton.MenuItems>
                  <UserButton.Action
                    label="Xem doanh nghiệp"
                    labelIcon={<FaBuilding />}
                    onClick={() => navigate('/my-business')}
                  />
                </UserButton.MenuItems>
              )}
              {role === 'client' && (
                <UserButton.MenuItems>
                  <UserButton.Action
                    label="Trở thành chủ doanh nghiệp"
                    labelIcon={<FaBuilding />}
                    onClick={() => navigate('/business-registration')}
                  />
                </UserButton.MenuItems>
              )}
            </UserButton>
          </div>
        </SignedIn>
        {/* <button
          className="header-menu-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button> */}
      </div>
    </header>
  );
};

export default Header;
