import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Users, CheckCircle, Calendar, Clock } from "lucide-react";
import TeacherSidebar from "./TeacherSidebar";
import "../styles/TeacherTests.css";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

const TeacherTests = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        // Fetch all tests from Firebase
        const testsCollection = collection(db, "tests");
        const testsSnapshot = await getDocs(testsCollection);
        
        const testsList = testsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setTests(testsList);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching tests:", err);
        setError("Failed to load tests.");
        setLoading(false);
      }
    };

    fetchTests();
  }, []);

  const handleTestClick = (testId) => {
    navigate(`/teacher/tests/insights/${testId}`);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTestStats = (test) => {
    const totalStudents = test.selectedStudents?.length || 0;
    const completedCount = 0; // Will be updated when students take the test
    const averageScore = 0; // Will be calculated from submissions

    return { totalStudents, completedCount, averageScore };
  };

  if (loading) {
    return (
      <div className="teacher-dashboard-wrapper">
        <TeacherSidebar />
        <div className="teacher-tests-main">
          <div className="loading-spinner">Loading tests...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="teacher-dashboard-wrapper">
        <TeacherSidebar />
        <div className="teacher-tests-main">
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-dashboard-wrapper">
      <TeacherSidebar />
      
      <div className="teacher-tests-main">
        <div className="tests-header">
          <div>
            <h1 className="tests-title">Conducted Tests</h1>
            <p className="tests-subtitle">View and analyze test performance</p>
          </div>
        </div>

        <div className="tests-stats-grid">
          <div className="stat-card-small">
            <div className="stat-icon-small stat-icon-blue">
              <FileText size={24} />
            </div>
            <div>
              <h3>Total Tests</h3>
              <p className="stat-number">{tests.length}</p>
            </div>
          </div>

          <div className="stat-card-small">
            <div className="stat-icon-small stat-icon-green">
              <CheckCircle size={24} />
            </div>
            <div>
              <h3>Active Tests</h3>
              <p className="stat-number">
                {tests.filter(t => t.status === 'active' || !t.status).length}
              </p>
            </div>
          </div>

          <div className="stat-card-small">
            <div className="stat-icon-small stat-icon-purple">
              <Users size={24} />
            </div>
            <div>
              <h3>Total Participants</h3>
              <p className="stat-number">
                {tests.reduce((sum, t) => sum + (t.selectedStudents?.length || 0), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="tests-grid">
          {tests.length === 0 ? (
            <div className="empty-state">
              <FileText size={64} strokeWidth={1.5} />
              <p>No tests conducted yet.</p>
              <p className="empty-state-hint">Tests will appear here once created from class details</p>
            </div>
          ) : (
            tests.map((test) => {
              const stats = getTestStats(test);
              return (
                <div
                  key={test.id}
                  className="test-card"
                  onClick={() => handleTestClick(test.id)}
                >
                  <div className="test-card-header">
                    <div className="test-icon-badge">
                      <FileText size={24} />
                    </div>
                    <span className={`test-status ${test.status || 'active'}`}>
                      {test.status || 'Active'}
                    </span>
                  </div>

                  <h3 className="test-title">{test.testName || "Untitled Test"}</h3>
                  
                  <div className="test-meta">
                    <span className="test-meta-item">
                      <Calendar size={16} />
                      {formatDate(test.createdAt)}
                    </span>
                    <span className="test-meta-item">
                      <Clock size={16} />
                      {test.duration || "60"} min
                    </span>
                  </div>

                  <div className="test-info-section">
                    <div className="test-info-item">
                      <span className="test-info-label">Class:</span>
                      <span className="test-info-value">{test.className} - {test.section}</span>
                    </div>
                    <div className="test-info-item">
                      <span className="test-info-label">Grade:</span>
                      <span className="test-info-value">{test.grade || 'N/A'}</span>
                    </div>
                    <div className="test-info-item">
                      <span className="test-info-label">Total Marks:</span>
                      <span className="test-info-value">{test.totalMarks || 0}</span>
                    </div>
                    <div className="test-info-item">
                      <span className="test-info-label">Questions:</span>
                      <span className="test-info-value">{test.questions?.length || 0}</span>
                    </div>
                  </div>

                  <div className="test-stats-row">
                    <div className="test-stat">
                      <span className="test-stat-label">Students</span>
                      <span className="test-stat-value">{stats.totalStudents}</span>
                    </div>
                    <div className="test-stat">
                      <span className="test-stat-label">Completed</span>
                      <span className="test-stat-value">{stats.completedCount}</span>
                    </div>
                    <div className="test-stat">
                      <span className="test-stat-label">Pending</span>
                      <span className="test-stat-value">{stats.totalStudents - stats.completedCount}</span>
                    </div>
                  </div>

                  <div className="test-card-footer">
                    <span className="view-insights">
                      View Insights
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="9 18 15 12 9 6" strokeWidth="2"/>
                      </svg>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherTests;