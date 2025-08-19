import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserCircle, FaSearch, FaSignOutAlt } from "react-icons/fa";

const Navbar = () => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const firstName = localStorage.getItem("firstname") || "";
  const lastName = localStorage.getItem("lastname") || "";

  const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

  const displayName = `${capitalize(firstName)} ${capitalize(lastName)}`.trim() || "User";

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("firstname");
    localStorage.removeItem("lastname");
    navigate("/login");
  };

  return (
    // *** UPDATED: Navbar चा बॅकग्राउंड कलर आणि बॉर्डर बदलली आहे ***
    <header className="w-full h-20 bg-gray-100 border-b border-gray-200 flex items-center justify-between px-6">
      {/* Search bar */}
      <div className="relative py-2 w-60">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <FaSearch />
        </span>
        <input
          type="text"
          placeholder="Search"
          className="pl-10 pr-3 py-2 border border-gray-300 rounded text-sm w-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* User dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 text-gray-700 hover:text-black transition"
        >
          <FaUserCircle className="text-xl" />
          <span className="text-sm font-medium">{displayName}</span>
        </button>

        {showDropdown && (
          // ड्रॉपडाउनचा बॅकग्राउंड पांढराच ठेवला आहे, जेणेकरून तो Navbar पेक्षा वेगळा दिसेल
          <div className="absolute right-0 mt-2 w-28 bg-white border rounded shadow-lg z-50">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm font-semibold text-red-500 hover:bg-gray-100"
            >
              <FaSignOutAlt className="text-red-500 text-base" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;