import React from "react";
import Sidebar from "../../Components/sidebar/Sidebar";
import Navbar from "../../Components/navbar/Navbar";
import Dashboard from "../../Components/dashboard/Dashboard";

const Home = () => {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        <Dashboard />
      </div>
    </div>
  );
};

export default Home;