import React from "react";
import { FaBell } from "react-icons/fa";

const Notifications = ({ onClick }) => {
  return (
    <div
      className="relative text-gray-200 cursor-pointer hover:text-pink-600"
      onClick={onClick}
    >
      <FaBell size={20} />
      {/* Optional: Badge */}
      {/* <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" /> */}
    </div>
  );
};

export default Notifications;
