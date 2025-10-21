import React from 'react';
import { FaTwitter, FaInstagram, FaEnvelope } from 'react-icons/fa';
import logo from '../assets/logo.png';

const Footer = () => {
  return (
    <footer className="mt-12 text-gray-400 bg-gray-900">
      <div className="flex flex-col items-center justify-center gap-6 px-4 py-6 mx-auto max-w-7xl sm:flex-row">
        {/* Logo & About */}
        <div className="flex flex-col items-center justify-center gap-3 text-center sm:flex-row sm:gap-4 sm:text-center">
          <div className="flex items-center gap-2">
            <img src={logo} alt="XStream Secrets" className="w-auto h-10" />
            
          </div>
          <p className="max-w-xs text-xs text-gray-400 sm:text-sm sm:max-w-md">
            is a website that embeds videos from legitimate adult sites for 18+ audiences. 
            We provide a curated viewing experience while respecting content creators’ platforms.
          </p>
        </div>

       
      </div>

      <div className="w-full px-4 py-3 mt-4 text-xs text-center border-t border-gray-700 sm:px-6">
  &copy; {new Date().getFullYear()} XStream Secrets. All Rights Reserved. For adults (18+) only.
</div>

    </footer>
  );
};

export default Footer;
