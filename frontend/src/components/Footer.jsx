import React, { useState } from 'react';
import '../css/Footer.css';
import { FaFacebookF, FaInstagram, FaGoogle } from 'react-icons/fa';

const Footer = () => {
  const [email, setEmail] = useState('');

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    setEmail('');
  };

  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="container">
          <div className="footer-content">
            <div className="footer-left">
              <h3>Liên hệ với chuyên gia của chúng tôi tại...</h3>
              <div className="contact-info">
              </div>
            </div>

            <div className="footer-right">
              <h3>Theo dõi chúng tôi</h3>
              <div className="social-links">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                  aria-label="Facebook"
                >
                  <FaFacebookF />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                  aria-label="Instagram"
                >
                  <FaInstagram />
                </a>
                <a
                  href="https://google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                  aria-label="Google"
                >
                  <FaGoogle />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-main">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-column">
              <h4>Liên hệ</h4>
              <ul className="footer-links">
                <li>Trường Đại học FPT, Thạch Hòa, Thạch Thất, Thành phố Hà Nội</li>
                <li>Locallink@gmail.com</li>
              </ul>
            </div>

            <div className="footer-column">
              <h4>Công ty</h4>
              <ul className="footer-links">
                <li><a href="#">Về chúng tôi</a></li>
                <li><a href="#">Liên hệ</a></li>
                <li><a href="#">Hướng dẫn du lịch</a></li>
                <li><a href="#">Chính sách dữ liệu</a></li>
                <li><a href="#">Chính sách cookie</a></li>
                <li><a href="#">Pháp lý</a></li>
                <li><a href="#">Sơ đồ trang web</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4>Hỗ trợ</h4>
              <ul className="footer-links">
                <li><a href="#">Liên hệ</a></li>
                <li><a href="#">Trung tâm trợ giúp</a></li>
                <li><a href="#">Chat trực tiếp</a></li>
                <li><a href="#">Cách hoạt động</a></li>
              </ul>
            </div>

            <div className="footer-column">
              <h4>Bản tin</h4>
              <p>Đăng ký nhận bản tin miễn phí và luôn cập nhật thông tin mới nhất</p>
              <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
                <input
                  type="email"
                  placeholder="Địa chỉ email của bạn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="newsletter-input"
                  required
                />
                <button type="submit" className="newsletter-btn">
                  Gửi
                </button>
              </form>
              {/* <div className="payment-methods">
                <img src="/visa.png" alt="Visa" />
                <img src="/mastercard.png" alt="Mastercard" />
                <img src="/paypal.png" alt="PayPal" />
                <img src="/amex.png" alt="American Express" />
              </div> */}
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <div className="footer-bottom-content">
            <p>© Bản quyền LocalLink 2024</p>
            <div className="footer-bottom-links">
              <a href="#">Chính sách bảo mật</a>
              <a href="#">Điều khoản dịch vụ</a>
              <a href="#">Chính sách cookie</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};


export default Footer;