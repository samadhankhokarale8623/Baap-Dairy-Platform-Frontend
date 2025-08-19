import React from "react";
import { NavLink } from "react-router-dom";
import {
  FaTachometerAlt,
  FaMoneyBill,
  FaList,
  FaChartBar,
  FaGlassWhiskey,
  FaUsersCog,
} from "react-icons/fa";
import { GiCow } from "react-icons/gi";
import Logo from "../../assets/Images/Cowlogo.png"; // ✅ Replace with correct path

const navItems = [
  { label: "Dashboard", icon: FaTachometerAlt, path: "/home" },
  { label: "Milk Collection", icon: FaGlassWhiskey, path: "/milk-collection" },
  { label: "UserManagement", icon: FaUsersCog, path: "/user-management" },
  { label: "Livestock", icon: GiCow, path: "/livestock" },
  { label: "Payments", icon: FaMoneyBill, path: "/payments" },
  { label: "Inventory", icon: FaList, path: "/inventory" },
  { label: "Reports", icon: FaChartBar, path: "/reports" },
];

const Sidebar = () => {
  return (
    <aside className="w-64 bg-black text-white min-h-screen px-6 py-8 hidden md:block">
      <h1 className="text-2xl font-bold mb-10 flex items-center gap-2">
        <img src={Logo} alt="Logo" className="w-12 h-12 object-contain" /> {/* ✅ Updated */}
        DairySoft
      </h1>
      <nav className="space-y-4">
        {navItems.map(({ label, icon: Icon, path }) => (
          <NavLink
            to={path}
            key={label}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-md transition duration-200 ${
                isActive ? "bg-gray-800 font-semibold" : "hover:bg-gray-700"
              }`
            }
          >
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
