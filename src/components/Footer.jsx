import React from 'react';
import './Footer.css';
import { FaTwitter, FaInstagram, FaEnvelope } from 'react-icons/fa';
import logo from '../assets/logo.png';

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-section about">
          <img src={logo} alt="XStream Secrets Logo" className="footer-logo" />
          <p>
            XStream Secrets is your premier destination for exclusive adult content. We are dedicated to providing a high-quality viewing experience with a vast library of videos.
          </p>
        </div>

       

      
      </div>
      <div className="footer-bottom">
        &copy; {new Date().getFullYear()} XStream Secrets. All Rights Reserved. For adults (18+) only.
      </div>
    </footer>
  );
};

export default Footer;
