import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Home, 
  BookOpen, 
  ClipboardList, 
  Award, 
  LogOut, 
  User,
  ChevronRight
} from "lucide-react";
import "../styles/StudentSidebar.css";

const StudentSidebar = ({ studentData }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <Home size={20} />,
      path: "/student-dashboard",
    },
    {
      id: "classes",
      label: "My Classes",
      icon: <BookOpen size={20} />,
      path: "/student-dashboard/classes",
    },
    {
      id: "pending-tests",
      label: "Pending Tests",
      icon: <ClipboardList size={20} />,
      path: "/student-dashboard/pending-tests",
    },
    {
      id: "results",
      label: "My Results",
      icon: <Award size={20} />,
      path: "/student-dashboard/results",
    },
  ];

  const handleLogout = () => {
    sessionStorage.removeItem("studentData");
    navigate("/");
  };

  const isActive = (path) => {
    if (path === "/student-dashboard") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="student-sidebar">
      <div className="sidebar-header">
        <div className="student-profile">
          <div className="profile-avatar">
            <User size={24} />
          </div>
          <div className="profile-info">
            <h3>{studentData?.name || "Student"}</h3>
            <p>{studentData?.rollNumber || "N/A"}</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-list">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                className={`nav-item ${isActive(item.path) ? "active" : ""}`}
                onClick={() => navigate(item.path)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                <ChevronRight size={16} className="nav-arrow" />
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default StudentSidebar;