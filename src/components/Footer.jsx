import React from 'react';
import { FaTwitter, FaInstagram, FaEnvelope } from 'react-icons/fa';
import logo from '../assets/logo.png';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-center gap-6">
        {/* Logo & About */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-center sm:text-center">
          <div className="flex items-center gap-2">
            <img src={logo} alt="XStream Secrets" className="h-10 w-auto" />
            
          </div>
          <p className="text-gray-400 text-xs sm:text-sm max-w-xs sm:max-w-md">
            is a website that embeds videos from legitimate adult sites for 18+ audiences. 
            We provide a curated viewing experience while respecting content creators’ platforms.
          </p>
        </div>

       
      </div>

      <div className="border-t border-gray-700 mt-4 text-center text-xs py-3">
        &copy; {new Date().getFullYear()} XStream Secrets. All Rights Reserved. For adults (18+) only.
      </div>
    </footer>
  );
};

export default Footer;
