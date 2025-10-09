import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaUserCircle, FaBuilding } from "react-icons/fa";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import axios from "axios";
import "../css/Header.css";
import AuthTokenReset from "../auth/AuthTokenReset";
import { getCurrentUserId } from "../utils/useCurrentUserId";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [hasBusiness, setHasBusiness] = useState(false);
  const accountRef = useRef(null);

  useEffect(() => {
    const fetchBusinessStatus = async () => {
      try {
        const ownerId = await getCurrentUserId();
        if (!ownerId) return;

        const response = await axios.get(`${import.meta.env.VITE_BE_URL}/api/business/owner/${ownerId}`);
        if (response.data && response.data.length > 0) {
          setHasBusiness(true);
        } else {
          setHasBusiness(false);
        }
      } catch (error) {
        console.error("Error fetching business data:", error);
        setHasBusiness(false);
      }
    };

    fetchBusinessStatus();
  }, []);

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

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

      {/* Show conditional link based on business existence */}
      {hasBusiness ? (
        <Link
          to="/my-business"
          className={`header-nav-link ${isActive("/my-business", true) ? "active" : ""}`}
        >
          Doanh nghiệp của tôi
        </Link>
      ) : (
        <Link
          to="/business-registration"
          className={`header-nav-link ${isActive("/business-registration", true) ? "active" : ""}`}
        >
          Đăng ký doanh nghiệp
        </Link>
      )}

      <Link
        to="/business-dashboard"
        className={`header-nav-link ${isActive("/business-dashboard") ? "active" : ""}`}
      >
        Hỗ trợ doanh nghiệp
      </Link>
    </nav>
  );

  const renderUserButtonMenu = () => {
    return (
      <UserButton.MenuItems>
        {hasBusiness ? (
          <UserButton.Action
            label="Xem doanh nghiệp"
            labelIcon={<FaBuilding />}
            onClick={() => navigate("/my-business")}
          />
        ) : (
          <UserButton.Action
            label="Đăng ký doanh nghiệp"
            labelIcon={<FaBuilding />}
            onClick={() => navigate("/business-registration")}
          />
        )}
      </UserButton.MenuItems>
    );
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
        {renderUserMenu()}

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
