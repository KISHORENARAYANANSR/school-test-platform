import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TeacherSidebar from "./TeacherSidebar";
import "../styles/TeacherDashboard.css";
import { db } from "../firebase";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [classes, setClasses] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        const storedLoginId = localStorage.getItem("teacherId");
        const storedDocId = localStorage.getItem("teacherDocId");

        if (!storedLoginId || !storedDocId) {
          setError("No valid login information found. Please log in again.");
          setLoading(false);
          return;
        }

        // Fetch teacher data
        const teacherRef = doc(db, "teachers", storedDocId);
        const teacherSnap = await getDoc(teacherRef);

        if (!teacherSnap.exists()) {
          setError("Teacher profile not found.");
          setLoading(false);
          return;
        }

        const teacherData = teacherSnap.data();
        setTeacher(teacherData);

        // Fetch classes
        let classQuery = query(
          collection(db, "classes"),
          where("teacherId", "==", storedDocId)
        );
        let classSnap = await getDocs(classQuery);

        if (classSnap.empty) {
          classQuery = query(
            collection(db, "classes"),
            where("teacherId", "==", storedLoginId)
          );
          classSnap = await getDocs(classQuery);
        }

        if (classSnap.empty) {
          const allClassesSnap = await getDocs(collection(db, "classes"));
          const filteredClasses = allClassesSnap.docs.filter(doc => {
            const data = doc.data();
            return data.teacherId === storedDocId || 
                   data.teacherId === storedLoginId ||
                   data.teacher === storedDocId ||
                   data.teacher === storedLoginId ||
                   (data.mappings && data.mappings.some(m => 
                     m.teacherId === storedDocId || m.teacherId === storedLoginId
                   ));
          });

          const classList = filteredClasses.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setClasses(classList);
        } else {
          const classList = classSnap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setClasses(classList);
        }

        // Fetch tests conducted by this teacher
        const testsQuery = query(
          collection(db, "tests"),
          where("teacherId", "==", storedDocId)
        );
        const testsSnap = await getDocs(testsQuery);
        const testsList = testsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTests(testsList);

        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard:", err);
        setError("Failed to load dashboard.");
        setLoading(false);
      }
    };

    fetchTeacherData();
  }, []);

  const handleClassClick = (classId) => {
    navigate(`/teacher/class/${classId}`);
  };

  const getTotalStudents = () => {
    return classes.reduce((total, cls) => total + (cls.students?.length || 0), 0);
  };

  if (loading) {
    return (
      <div className="teacher-dashboard-wrapper">
        <TeacherSidebar />
        <div className="teacher-dashboard-main">
          <div className="loading-spinner">Loading…</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="teacher-dashboard-wrapper">
        <TeacherSidebar />
        <div className="teacher-dashboard-main">
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-dashboard-wrapper">
      <TeacherSidebar />
      
      <div className="teacher-dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Welcome, {teacher?.name}</h1>
            <p className="dashboard-subtitle">Manage your classes and track student progress</p>
          </div>
          <button className="btn-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" strokeWidth="2"/>
            </svg>
            Growing Together
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card stat-card-green">
            <div className="stat-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
                <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/>
                <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/>
                <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
              </svg>
            </div>
            <div className="stat-content">
              <h3 className="stat-label">Total Classes</h3>
              <p className="stat-value">{classes.length}</p>
              <p className="stat-description">Active Classes</p>
            </div>
          </div>

          <div className="stat-card stat-card-orange">
            <div className="stat-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeWidth="2"/>
                <circle cx="9" cy="7" r="4" strokeWidth="2"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" strokeWidth="2"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeWidth="2"/>
              </svg>
            </div>
            <div className="stat-content">
              <h3 className="stat-label">Total Students</h3>
              <p className="stat-value">{getTotalStudents()}</p>
              <p className="stat-description">Young Learners</p>
            </div>
          </div>

          <div className="stat-card stat-card-teal">
            <div className="stat-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" strokeWidth="2"/>
                <path d="M6 12v5c3 3 9 3 12 0v-5" strokeWidth="2"/>
              </svg>
            </div>
            <div className="stat-content">
              <h3 className="stat-label">Department</h3>
              <p className="stat-value-text">{teacher?.department || "N/A"}</p>
              <p className="stat-description">{teacher?.subject || "Subject"}</p>
            </div>
          </div>

          <div className="stat-card stat-card-yellow">
            <div className="stat-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeWidth="2"/>
                <polyline points="14 2 14 8 20 8" strokeWidth="2"/>
              </svg>
            </div>
            <div className="stat-content">
              <h3 className="stat-label">Tests Conducted</h3>
              <p className="stat-value">{tests.length}</p>
              <p className="stat-description">This Semester</p>
            </div>
          </div>
        </div>

        <div className="section-header">
          <h2 className="section-title">My Classes</h2>
        </div>

        <div className="classes-grid">
          {classes.length === 0 ? (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
                <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/>
                <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/>
                <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
              </svg>
              <p>No classes assigned to you yet.</p>
            </div>
          ) : (
            classes.map((cls) => (
              <div
                key={cls.id}
                className="class-card"
                onClick={() => handleClassClick(cls.id)}
              >
                <div className="class-card-header">
                  <div className="class-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" strokeWidth="2"/>
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" strokeWidth="2"/>
                    </svg>
                  </div>
                  <h3 className="class-title">{cls.name} - {cls.section}</h3>
                </div>
                
                <div className="class-info">
                  <div className="info-item">
                    <span className="info-label">Grade</span>
                    <span className="info-value">{cls.grade}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Subject</span>
                    <span className="info-value">{cls.mappings?.[0]?.subject || cls.subject || "N/A"}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Students</span>
                    <span className="info-value">{cls.students?.length || 0}</span>
                  </div>
                </div>

                <div className="class-card-footer">
                  <span className="view-details">
                    View Details
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polyline points="9 18 15 12 9 6" strokeWidth="2"/>
                    </svg>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;