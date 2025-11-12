// src/pages/Departments.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowLeft, Home, Users, GraduationCap, Building2, Key, LogOut, Leaf } from 'lucide-react';
import pupilLogo from "../assets/pupil.jpg";
import '../styles/Departments.css';

function Sidebar() {
  const navigate = useNavigate();
  const location = window.location.pathname;

  const handleLogout = () => {
    console.log("Logging out...");
    navigate("/");
  };

  const isActive = (path) => {
    return location === path;
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
        <div className={`nav-item ${isActive("/admin") ? "active" : ""}`} onClick={() => navigate("/admin")}>
          <Home size={20} className="nav-icon" />
          <span>Dashboard</span>
        </div>
        <div className={`nav-item ${isActive("/teachers") ? "active" : ""}`} onClick={() => navigate("/teachers")}>
          <Users size={20} className="nav-icon" />
          <span>Teachers</span>
        </div>
        <div className={`nav-item ${isActive("/manage-students") ? "active" : ""}`} onClick={() => navigate("/manage-students")}>
          <GraduationCap size={20} className="nav-icon" />
          <span>Students</span>
        </div>
        <div className={`nav-item ${isActive("/departments") ? "active" : ""}`} onClick={() => navigate("/departments")}>
          <Building2 size={20} className="nav-icon" />
          <span>Departments</span>
        </div>
        <div className={`nav-item ${isActive("/credentials") ? "active" : ""}`} onClick={() => navigate("/credentials")}>
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

function Departments() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teachersLoading, setTeachersLoading] = useState(false);

  // Fetch all departments from teachers collection (same as AdminDashboard)
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoading(true);
        console.log('Fetching teachers to extract departments...');
        
        // Fetch all teachers
        const teacherSnap = await getDocs(collection(db, "teachers"));
        console.log('Total teachers found:', teacherSnap.size);
        
        // Extract unique departments with teacher counts
        const departmentMap = new Map();
        const teachersByDept = new Map();
        
        teacherSnap.forEach((doc) => {
          const data = doc.data();
          console.log('Teacher data:', doc.id, data);
          
          if (data.department) {
            const deptName = data.department.trim();
            
            // Count teachers per department
            if (departmentMap.has(deptName)) {
              departmentMap.set(deptName, departmentMap.get(deptName) + 1);
            } else {
              departmentMap.set(deptName, 1);
            }
            
            // Store teachers by department
            if (!teachersByDept.has(deptName)) {
              teachersByDept.set(deptName, []);
            }
            teachersByDept.get(deptName).push({
              id: doc.id,
              ...data
            });
          }
        });
        
        // Convert to array of department objects
        const deptArray = Array.from(departmentMap.entries()).map(([name, count], index) => ({
          id: `dept-${index}`,
          name: name,
          teacherCount: count,
          description: `${name} Department`,
          subjectCount: 0 // You can add logic to count subjects if available
        }));
        
        console.log('Extracted departments:', deptArray);
        setDepartments(deptArray);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching departments:", error);
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  // Fetch teachers for a specific department
  const fetchTeachersByDepartment = async (departmentId, departmentName) => {
    try {
      setTeachersLoading(true);
      setSelectedDepartment({ id: departmentId, name: departmentName });
      
      console.log('Fetching teachers for department:', departmentName);
      
      // Fetch all teachers and filter by department
      const teacherSnap = await getDocs(collection(db, "teachers"));
      console.log('Total teachers in database:', teacherSnap.size);
      
      const teacherData = [];
      teacherSnap.forEach((doc) => {
        const data = doc.data();
        const teacherDept = (data.department || '').trim();
        
        // Case-insensitive match
        if (teacherDept.toLowerCase() === departmentName.toLowerCase()) {
          teacherData.push({
            id: doc.id,
            ...data
          });
        }
      });
      
      console.log('Teachers found in department:', teacherData.length);
      console.log('Teacher data:', teacherData);
      setTeachers(teacherData);
      setTeachersLoading(false);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      setTeachersLoading(false);
    }
  };

  const handleBackToDepartments = () => {
    setSelectedDepartment(null);
    setTeachers([]);
  };

  const handleBackToDashboard = () => {
    navigate('/admin');
  };

  // Department Icons mapping
  const getDepartmentIcon = (name) => {
    const nameLower = (name || '').toLowerCase();
    const icons = {
      'mathematics': '🔢',
      'math': '🔢',
      'science': '🔬',
      'english': '📚',
      'social studies': '🌍',
      'social': '🌍',
      'computer science': '💻',
      'computer': '💻',
      'it': '💻',
      'arts': '🎨',
      'art': '🎨',
      'physical education': '⚽',
      'sports': '⚽',
      'pe': '⚽',
      'music': '🎵',
      'languages': '🗣️',
      'language': '🗣️',
      'commerce': '💼',
      'business': '💼',
      'physics': '⚛️',
      'chemistry': '🧪',
      'biology': '🧬',
      'history': '📜',
      'geography': '🗺️'
    };
    
    for (let key in icons) {
      if (nameLower.includes(key)) {
        return icons[key];
      }
    }
    return '📖';
  };

  // Department Colors
  const getDepartmentColor = (index) => {
    const colors = [
      '#2D5F5D', '#E07856', '#26A69A', '#F39C12',
      '#8E44AD', '#3498DB', '#E74C3C', '#16A085',
      '#D35400', '#27AE60', '#C0392B', '#2980B9'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="admin-container">
      <Sidebar />
      
      <div className="main-content">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading Departments...</p>
          </div>
        ) : (
          <>
            {!selectedDepartment ? (
              <>
                <div className="departments-header">
                  <div className="header-top">
                    <button className="dashboard-button" onClick={handleBackToDashboard}>
                      <Home size={20} />
                      <span>Back to Dashboard</span>
                    </button>
                  </div>
                  <h1>Departments</h1>
                  <p className="departments-subtitle">
                    Total Departments: <span className="highlight">{departments.length}</span>
                  </p>
                </div>

                <div className="departments-grid">
                  {departments.length === 0 ? (
                    <div className="no-data">
                      <div className="no-data-icon">📂</div>
                      <h3>No Departments Found</h3>
                      <p>No teachers have been assigned to any departments yet.</p>
                      <p className="hint">Add teachers with department information to see them here.</p>
                    </div>
                  ) : (
                    departments.map((dept, index) => (
                      <div
                        key={dept.id}
                        className="department-card"
                        style={{ borderLeftColor: getDepartmentColor(index) }}
                        onClick={() => fetchTeachersByDepartment(dept.id, dept.name)}
                      >
                        <div className="department-icon" style={{ backgroundColor: getDepartmentColor(index) }}>
                          {getDepartmentIcon(dept.name)}
                        </div>
                        <div className="department-info">
                          <h3>{dept.name || 'Unnamed Department'}</h3>
                          <p className="department-desc">{dept.description || 'No description available'}</p>
                          <div className="department-stats">
                            <span className="stat-badge">
                              <i className="icon">👥</i>
                              {dept.teacherCount || 0} Teachers
                            </span>
                            <span className="stat-badge">
                              <i className="icon">📚</i>
                              {dept.subjectCount || 0} Subjects
                            </span>
                          </div>
                        </div>
                        <div className="department-arrow">→</div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="teachers-header">
                  <div className="header-actions">
                    <button className="back-button" onClick={handleBackToDepartments}>
                      <ArrowLeft size={20} />
                      <span>Back to Departments</span>
                    </button>
                    <button className="dashboard-button-small" onClick={handleBackToDashboard}>
                      <Home size={18} />
                    </button>
                  </div>
                  <h1>{selectedDepartment.name} Department</h1>
                  <p className="teachers-subtitle">
                    Total Teachers: <span className="highlight">{teachers.length}</span>
                  </p>
                </div>

                {teachersLoading ? (
                  <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading Teachers...</p>
                  </div>
                ) : (
                  <div className="teachers-grid">
                    {teachers.length === 0 ? (
                      <div className="no-data">
                        <div className="no-data-icon">👥</div>
                        <h3>No Teachers Found</h3>
                        <p>No teachers are currently assigned to this department.</p>
                      </div>
                    ) : (
                      teachers.map((teacher) => (
                        <div key={teacher.id} className="teacher-card">
                          <div className="teacher-avatar">
                            {teacher.name ? teacher.name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <div className="teacher-details">
                            <h3>{teacher.name || 'Unknown Teacher'}</h3>
                            <p className="teacher-id">ID: {teacher.teacherId || teacher.id}</p>
                            <div className="teacher-info-grid">
                              <div className="info-item">
                                <span className="info-label">Email:</span>
                                <span className="info-value">{teacher.email || 'N/A'}</span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">Phone:</span>
                                <span className="info-value">{teacher.phone || teacher.phoneNumber || 'N/A'}</span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">Subject:</span>
                                <span className="info-value">{teacher.subject || teacher.subjects || 'N/A'}</span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">Department:</span>
                                <span className="info-value">{teacher.department || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Departments;