import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  User, 
  FileText, 
  LogOut,
  Leaf
} from "lucide-react";
import "../styles/Sidebar.css";
import pupilLogo from "../assets/pupil.jpg"; // Adjust the path as needed

const TeacherSidebar = () => {
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault();
    
    const confirmLogout = window.confirm("Are you sure you want to logout?");
    if (confirmLogout) {
      localStorage.removeItem("teacherId");
      localStorage.removeItem("teacherDocId");
      navigate("/");
    }
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
        <li>
          <NavLink 
            to="/teacher" 
            end
            className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
          >
            <LayoutDashboard size={20} className="menu-icon" />
            <span className="menu-text">Dashboard</span>
          </NavLink>
        </li>

        <li>
          <NavLink 
            to="/teacher/profile" 
            className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
          >
            <User size={20} className="menu-icon" />
            <span className="menu-text">My Profile</span>
          </NavLink>
        </li>

        <li>
          <NavLink 
            to="/teacher/tests" 
            className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}
          >
            <FileText size={20} className="menu-icon" />
            <span className="menu-text">Tests</span>
          </NavLink>
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
};

export default TeacherSidebar;