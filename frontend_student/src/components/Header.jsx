import React, { useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaUserCircle, FaHome, FaUserCog } from "react-icons/fa";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import "../css/Header.css";
import AuthTokenReset from "../auth/AuthTokenReset";
import { useUserRole } from "../contexts/UserRoleContext";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin");
  const { role } = useUserRole();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountRef = useRef(null);

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const renderAdminMenu = () => (
    <nav className="header-nav">
      <Link
        to="/admin/users"
        className={`header-nav-link ${
          isActive("/admin/users", true) ? "active" : ""
        }`}
      >
        Người dùng
      </Link>
      <Link
        to="/admin/businesses"
        className={`header-nav-link ${
          isActive("/admin/businesses", true) ? "active" : ""
        }`}
      >
        Doanh nghiệp
      </Link>
      <Link
        to="/admin/transactions"
        className={`header-nav-link ${
          isActive("/admin/transactions", true) ? "active" : ""
        }`}
      >
        Giao dịch
      </Link>
      <Link
        to="/admin/feedback"
        className={`header-nav-link ${
          isActive("/admin/feedback", true) ? "active" : ""
        }`}
      >
        Doanh nghiệp phản hồi
      </Link>
      <Link
        to="/admin/aibots"
        className={`header-nav-link ${
          isActive("/admin/aibots", true) ? "active" : ""
        }`}
      >
        AI Bot
      </Link>
    </nav>
  );

  const renderUserMenu = () => (
    <nav className={`header-nav ${isMenuOpen ? "active" : ""}`}>
      {role === "client" && (
        <>
          <Link
            to="/"
            className={`header-nav-link ${isActive("/", true) ? "active" : ""}`}
          >
            Trang chủ
          </Link>
          <Link
            to="/discover"
            className={`header-nav-link ${
              isActive("/discover") ? "active" : ""
            }`}
          >
            Kết nối doanh nghiệp
          </Link>
          <Link
            to="/dashboard"
            className={`header-nav-link ${
              isActive("/dashboard") ? "active" : ""
            }`}
          >
            Hỗ trợ học tập
          </Link>
        </>
      )}
    </nav>
  );

  const renderUserButtonMenu = () => {
    if (role === "admin") {
      return (
        <UserButton.MenuItems>
          {isAdminPage ? (
            <UserButton.Action
              label="Trang chủ"
              labelIcon={<FaHome />}
              onClick={() => navigate("/")}
            />
          ) : (
            <UserButton.Action
              label="Quản trị hệ thống"
              labelIcon={<FaUserCog />}
              onClick={() => navigate("/admin/users")}
            />
          )}
        </UserButton.MenuItems>
      );
    }
    return null;
  };

  const renderMenu = () => {
    // Nếu là admin và đang ở homepage, không hiển thị menu
    if (role === "admin" && !isAdminPage) {
      return null;
    }
    // Nếu là admin và đang ở admin page, hiển thị admin menu
    if (role === "admin" && isAdminPage) {
      return renderAdminMenu();
    }
    // Các trường hợp khác hiển thị user menu
    return renderUserMenu();
  };

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

        {renderMenu()}

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
              {renderUserButtonMenu()}
            </UserButton>
          </div>
        </SignedIn>
      </div>
    </header>
  );
};

export default Header;
