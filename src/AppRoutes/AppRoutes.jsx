import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Register from "../Pages/Register/Register";
// import Dashboard from "../Components/dashboard/Dashboard";
import Home from "../Pages/home/Home";
import MilkCollectionPage from "../Pages/milkcollectionpage/MilkCollectionPage";
import PortalSelection from "../Pages/Portel/PortalSelection";
import Login from "../Pages/Login/Login.jsx";
import UserManagementPage from "../Pages/UserManagement/UserManagement.jsx";

const AppRoutes = () => {
  return (
    <div className="flex min-h-screen overflow-hidden">
      <Routes>
        <Route path="/" element={<Navigate to="/portl-selection" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />s
        <Route path="/register" element={<Register />} />
        <Route path="/milk-collection" element={<MilkCollectionPage />} />
        <Route path="/portl-selection" element={<PortalSelection/>}/>
        <Route path="user-management" element={<UserManagementPage/>}/>
        {/* <Route path="/dashboard" element={<Dashboard />} /> */}
      </Routes>
    </div>
  );
};

export default AppRoutes;
