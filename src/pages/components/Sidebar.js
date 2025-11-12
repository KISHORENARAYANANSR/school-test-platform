// src/components/Sidebar.js
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Home, 
  Users, 
  GraduationCap, 
  Building2, 
  Key, 
  Settings, 
  LogOut,
  Leaf
} from "lucide-react";
import "../../styles/Sidebar.css";
import pupilLogo from "../../assets/pupil.jpg";


function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    // Add your logout logic here (e.g., clear auth tokens, reset state)
    console.log("Logging out...");
    // Example: localStorage.removeItem('authToken');
    navigate("/");
  };

  // Helper function to check if a menu item is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="sidebar">
      <div className="logo-container">
      <img 
        src={pupilLogo} 
        alt="The Pupil Saveetha Eco School"
        className="school-logo"
      />

        <div className="school-name">
          <span className="school-title">THE PUPIL</span>
          <span className="school-subtitle">Saveetha Eco School</span>
        </div>
      </div>

      <ul className="menu">
        <li 
          onClick={() => navigate("/admin")} 
          className={`menu-item ${isActive("/admin") ? "active" : ""}`}
        >
          <Home size={20} className="menu-icon" />
          <span className="menu-text">Dashboard</span>
        </li>
        <li 
          onClick={() => navigate("/teachers")} 
          className={`menu-item ${isActive("/teachers") ? "active" : ""}`}
        >
          <Users size={20} className="menu-icon" />
          <span className="menu-text">Teachers</span>
        </li>
        <li 
          onClick={() => navigate("/manage-students")} 
          className={`menu-item ${isActive("/manage-students") ? "active" : ""}`}
        >
          <GraduationCap size={20} className="menu-icon" />
          <span className="menu-text">Students</span>
        </li>
        <li 
          onClick={() => navigate("/departments")} 
          className={`menu-item ${isActive("/departments") ? "active" : ""}`}
        >
          <Building2 size={20} className="menu-icon" />
          <span className="menu-text">Departments</span>
        </li>
        <li 
          onClick={() => navigate("/credentials")} 
          className={`menu-item ${isActive("/credentials") ? "active" : ""}`}
        >
          <Key size={20} className="menu-icon" />
          <span className="menu-text">Credentials</span>
        </li>
      </ul>

      <div className="sidebar-footer">
        <div className="eco-badge">
          <Leaf size={18} className="leaf-icon" />
          <span>Eco-Friendly Learning</span>
        </div>
        
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={20} className="logout-icon" />
          <span className="logout-text">Logout</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;