import React, { useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaUserCircle, FaHome, FaUserCog, FaBuilding } from "react-icons/fa";
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
        className={`header-nav-link ${isActive("/admin/users", true) ? "active" : ""}`}
      >
        Người dùng
      </Link>
      <Link
        to="/admin/businesses"
        className={`header-nav-link ${isActive("/admin/businesses", true) ? "active" : ""}`}
      >
        Doanh nghiệp
      </Link>
      <Link
        to="/admin/transactions"
        className={`header-nav-link ${isActive("/admin/transactions", true) ? "active" : ""}`}
      >
        Giao dịch
      </Link>
      <Link
        to="/admin/aibots"
        className={`header-nav-link ${isActive("/admin/aibots", true) ? "active" : ""}`}
      >
        AI Bot
      </Link>
      <Link
        to="/admin/feedback"
        className={`header-nav-link ${isActive("/admin/feedback", true) ? "active" : ""}`}
      >
        Business Feedback
      </Link>
    </nav>
  );

  //  Menu cho guest / client / owner
  const renderUserMenu = () => (
    <nav className={`header-nav ${isMenuOpen ? "active" : ""}`}>
      <Link
        to="/"
        className={`header-nav-link ${isActive("/", true) ? "active" : ""}`}
      >
        Trang chủ
      </Link>

      <Link
        to="/discover"
        className={`header-nav-link ${isActive("/discover") ? "active" : ""}`}
      >
        Kết nối doanh nghiệp
      </Link>

      {/* Client menu */}
      {role === "client" && (
        <>
          <Link
            to="/dashboard"
            className={`header-nav-link ${isActive("/dashboard") ? "active" : ""}`}
          >
            Hỗ trợ học tập
          </Link>
        </>
      )}

      {/* Owner menu */}
      {role === "owner" && (
        <>
          <Link
            to="/my-business"
            className={`header-nav-link ${isActive("/my-business", true) ? "active" : ""}`}
          >
            Doanh nghiệp của tôi
          </Link>
          <Link
            to="/business-dashboard"
            className={`header-nav-link ${isActive("/business-dashboard") ? "active" : ""}`}
          >
            Hỗ trợ doanh nghiệp
          </Link>
        </>
      )}
    </nav>
  );

  //  Menu trong UserButton theo role
  const renderUserButtonMenu = () => {
    switch (role) {
      case "admin":
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
      case "owner":
        return (
          <UserButton.MenuItems>
            <UserButton.Action
              label="Xem doanh nghiệp"
              labelIcon={<FaBuilding />}
              onClick={() => navigate("/my-business")}
            />
          </UserButton.MenuItems>
        );
      case "client":
        return (
          <UserButton.MenuItems>
            <UserButton.Action
              label="Trở thành chủ doanh nghiệp"
              labelIcon={<FaBuilding />}
              onClick={() => navigate("/business-registration")}
            />
          </UserButton.MenuItems>
        );
      default:
        return null; 
    }
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo */}
        <div className="header-left">
          <Link to="/">
            <img
              src="/Logo_FPT_Education.png"
              alt="FPT Education Logo"
              className="header-logo"
            />
          </Link>
        </div>

        {/* Menu điều hướng */}
        {role === "admin" && isAdminPage ? renderAdminMenu() : renderUserMenu()}

        {/* Account menu */}
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
