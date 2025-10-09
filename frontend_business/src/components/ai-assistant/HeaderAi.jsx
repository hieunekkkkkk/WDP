import React, { useState, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaUserCircle, FaHome, FaUserCog, FaBuilding } from "react-icons/fa";
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/clerk-react";
import "../../css/HeaderAi.css";
import AuthTokenReset from "../../auth/AuthTokenReset";

const HeaderAi = () => {
  const { user } = useUser(); 
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountRef = useRef(null);

  return (
    <header className="header">
      <div className="header-container">
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
            <UserButton
              userProfileUrl="/user-profile"
              appearance={{ elements: { userButtonAvatarBox: "avatar-box" } }}
            />
            <span className="header-username">
              {user?.fullName || user?.username}
            </span>
          </div>
        </SignedIn>
      </div>
    </header>
  );
};

export default HeaderAi;
