// src/pages/AdminDashboard.js
import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import pupilLogo from "../assets/pupil.jpg";

import { 
  Users, 
  GraduationCap, 
  Building2, 
  FileText, 
  UserPlus, 
  MapPin,
  Home,
  Key,
  Settings,
  LogOut,
  Leaf,
  DoorOpen
} from "lucide-react";
import { db } from "../firebase";
import "../styles/AdminDashboard.css";

function StatCard({ title, value, subtitle, gradient, icon: Icon }) {
  return (
    <div className="stat-card" style={{ background: gradient }}>
      <div className="stat-icon">
        <Icon size={32} strokeWidth={2} />
      </div>
      <div className="stat-content">
        <h4>{title}</h4>
        <div className="stat-value">{value}</div>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Add your logout logic here (e.g., clear auth tokens, reset state)
    console.log("Logging out...");
    // Example: localStorage.removeItem('authToken');
    navigate("/");
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
      
      <nav className="sidebar-nav">
        <div className="nav-item active" onClick={() => navigate("/admin")}>
          <Home size={20} className="nav-icon" />
          <span>Dashboard</span>
        </div>
        <div className="nav-item" onClick={() => navigate("/teachers")}>
          <Users size={20} className="nav-icon" />
          <span>Teachers</span>
        </div>
        <div className="nav-item" onClick={() => navigate("/manage-students")}>
          <GraduationCap size={20} className="nav-icon" />
          <span>Students</span>
        </div>
        <div className="nav-item" onClick={() => navigate("/departments")}>
          <Building2 size={20} className="nav-icon" />
          <span>Departments</span>
        </div>
        <div className="nav-item" onClick={() => navigate("/credentials")}>
          <Key size={20} className="nav-icon" />
          <span>Credentials</span>
        </div>

      </nav>
      
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

function AdminDashboard() {
  const navigate = useNavigate();
  const [teacherCount, setTeacherCount] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [departmentCount, setDepartmentCount] = useState(0);
  const [classroomCount, setClassroomCount] = useState(0);

  // Fetch teacher, student, department, and classroom counts dynamically
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Fetch teachers
        const teacherSnap = await getDocs(collection(db, "teachers"));
        setTeacherCount(teacherSnap.size);

        // Extract unique departments from teachers
        const departments = new Set();
        teacherSnap.forEach((doc) => {
          const data = doc.data();
          if (data.department) {
            departments.add(data.department.trim().toLowerCase());
          }
        });
        setDepartmentCount(departments.size);

        // Fetch students
        const studentSnap = await getDocs(collection(db, "students"));
        setStudentCount(studentSnap.size);

        // Fetch classrooms (assuming you have a 'classes' collection)
        const classSnap = await getDocs(collection(db, "classes"));
        setClassroomCount(classSnap.size);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchCounts();
  }, []);

  return (
    <div className="admin-container">
      <Sidebar />
      
      <div className="main-content">
        <div className="header-section">
          <div>
            <h2>Welcome, Admin</h2>
            <p className="header-subtitle">Manage your school efficiently with eco-conscious practices</p>
          </div>
          <div className="header-badge">
            <Leaf size={20} />
            <span>Growing Together</span>
          </div>
        </div>

        {/* Top Stats */}
        <div className="stats-row">
          <StatCard
            title="Total Teachers"
            value={teacherCount}
            subtitle={`${teacherCount} Active Educators`}
            gradient="linear-gradient(135deg, #2d5f3f, #3d7f5f)"
            icon={GraduationCap}
          />
          <StatCard
            title="Total Students"
            value={studentCount}
            subtitle={`${studentCount} Young Learners`}
            gradient="linear-gradient(135deg, #ff7043, #ff8a65)"
            icon={Users}
          />
          <StatCard
            title="Departments"
            value={departmentCount}
            subtitle={`${departmentCount} Academic Streams`}
            gradient="linear-gradient(135deg, #10b981, #34d399)"
            icon={Building2}
          />
          <StatCard
            title="Classrooms"
            value={classroomCount}
            subtitle={`${classroomCount} Active Classes`}
            gradient="linear-gradient(135deg, #8b5cf6, #a78bfa)"
            icon={DoorOpen}
          />
        </div>

        {/* User Management Section */}
        <div className="section">
          <h3>
            <Users size={24} />
            User Management & Tools
          </h3>
          <div className="tools-row">
            <div className="tool-card green-theme">
              <div className="tool-icon">
                <UserPlus size={28} />
              </div>
              <h4>Add New Student</h4>
              <p>Register students manually or bulk upload via Excel</p>
              <button onClick={() => navigate("/add-student")}>
                Add Student
              </button>
            </div>
            
            <div className="tool-card orange-theme">
              <div className="tool-icon">
                <GraduationCap size={28} />
              </div>
              <h4>Add New Teacher</h4>
              <p>Onboard teachers manually or bulk upload via Excel</p>
              <button onClick={() => navigate("/add-teacher")}>
                Add Teacher
              </button>
            </div>
            
            <div className="tool-card eco-theme">
              <div className="tool-icon">
                <MapPin size={28} />
              </div>
              <h4>Map Teachers to Classes</h4>
              <p>Assign teachers to subjects and class sections</p>
              <button onClick={() => navigate("/map-classes")}>
                Go to Mapping
              </button>
            </div>
          </div>
        </div>

        {/* Database Overview Section */}
        <div className="section">
          <h3>
            <FileText size={24} />
            Database Overview
          </h3>
          <div className="overview-row">
            <div className="overview-card">
              <h4>Department-wise Teacher Distribution</h4>
              <div className="chart-placeholder">
                <div className="chart-icon">📊</div>
                <p>Pie Chart Visualization</p>
              </div>
            </div>
            
            <div className="overview-card">
              <h4>Grade-wise Student Overview</h4>
              <div className="chart-placeholder">
                <div className="chart-icon">📈</div>
                <p>Bar Chart Visualization</p>
              </div>
            </div>
            
            <div className="overview-card">
              <h4>Recent Activity Log</h4>
              <ul className="activity-log">
                <li>
                  <span className="activity-icon green">
                    <GraduationCap size={16} />
                  </span>
                  <span>Class 9 - 429 Students enrolled</span>
                </li>
                <li>
                  <span className="activity-icon orange">
                    <Users size={16} />
                  </span>
                  <span>Teacher John D. added Class 10A results</span>
                </li>
                <li>
                  <span className="activity-icon green">
                    <FileText size={16} />
                  </span>
                  <span>Admin updated student records</span>
                </li>
                <li>
                  <span className="activity-icon orange">
                    <Building2 size={16} />
                  </span>
                  <span>Test "Algebra I" launched by Ms. Sharma</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;