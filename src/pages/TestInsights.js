import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, CheckCircle, TrendingUp, Award, AlertCircle, Calendar, Clock, FileText, Target } from "lucide-react";
import TeacherSidebar from "./TeacherSidebar";
import "../styles/TestInsights.css";
import { db } from "../firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";

const TestInsights = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTestDetails = async () => {
      try {
        // Fetch test details
        const testRef = doc(db, "tests", testId);
        const testSnap = await getDoc(testRef);

        if (!testSnap.exists()) {
          setError("Test not found.");
          setLoading(false);
          return;
        }

        const testData = { id: testSnap.id, ...testSnap.data() };
        setTest(testData);

        // Fetch student details if selectedStudents exists
        if (testData.selectedStudents && testData.selectedStudents.length > 0) {
          const studentPromises = testData.selectedStudents.map(async (studentId) => {
            try {
              const studentRef = doc(db, "students", studentId);
              const studentSnap = await getDoc(studentRef);
              
              if (studentSnap.exists()) {
                return {
                  id: studentSnap.id,
                  ...studentSnap.data()
                };
              }
              return {
                id: studentId,
                name: "Unknown Student",
                rollNumber: "N/A"
              };
            } catch (err) {
              console.error(`Error fetching student ${studentId}:`, err);
              return {
                id: studentId,
                name: "Unknown Student",
                rollNumber: "N/A"
              };
            }
          });

          const studentsList = await Promise.all(studentPromises);
          setStudents(studentsList);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching test details:", err);
        setError("Failed to load test insights.");
        setLoading(false);
      }
    };

    fetchTestDetails();
  }, [testId]);

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    if (timestamp.toDate) {
      return timestamp.toDate().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTestAnalytics = () => {
    if (!test) return null;

    const totalStudents = students.length;
    const completedCount = 0; // Will be updated when students submit
    const pendingCount = totalStudents - completedCount;

    // These will be calculated from actual submissions
    const averageScore = 0;
    const highestScore = 0;
    const lowestScore = 0;
    const passCount = 0;
    const failCount = 0;
    const passRate = 0;

    const topPerformers = [];
    const needsAttention = [];

    return {
      totalStudents,
      completedCount,
      pendingCount,
      averageScore,
      highestScore,
      lowestScore,
      passCount,
      failCount,
      passRate,
      topPerformers,
      needsAttention
    };
  };

  if (loading) {
    return (
      <div className="teacher-dashboard-wrapper">
        <TeacherSidebar />
        <div className="test-insights-main">
          <div className="loading-spinner">Loading test insights...</div>
        </div>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="teacher-dashboard-wrapper">
        <TeacherSidebar />
        <div className="test-insights-main">
          <div className="error-message">{error || "Test not found"}</div>
          <button className="btn-back" onClick={() => navigate('/teacher/tests')}>
            <ArrowLeft size={18} />
            <span>Back to Tests</span>
          </button>
        </div>
      </div>
    );
  }

  const analytics = getTestAnalytics();

  return (
    <div className="teacher-dashboard-wrapper">
      <TeacherSidebar />
      
      <div className="test-insights-main">
        <div className="insights-header">
          <button className="btn-back-small" onClick={() => navigate('/teacher/tests')}>
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          
          <div className="header-content">
            <h1 className="insights-title">{test.testName || "Test Insights"}</h1>
            <p className="insights-subtitle">Detailed performance analysis</p>
          </div>
        </div>

        <div className="test-info-card">
          <div className="info-row">
            <div className="info-col">
              <Calendar size={18} className="info-icon" />
              <span className="info-label">Test Date</span>
              <span className="info-value">{formatDate(test.createdAt)}</span>
            </div>
            <div className="info-col">
              <Clock size={18} className="info-icon" />
              <span className="info-label">Duration</span>
              <span className="info-value">{test.duration || "60"} minutes</span>
            </div>
            <div className="info-col">
              <Target size={18} className="info-icon" />
              <span className="info-label">Total Marks</span>
              <span className="info-value">{test.totalMarks || 100}</span>
            </div>
            <div className="info-col">
              <FileText size={18} className="info-icon" />
              <span className="info-label">Questions</span>
              <span className="info-value">{test.questions?.length || 0}</span>
            </div>
          </div>
          
          <div className="test-details-section">
            <div className="detail-item">
              <span className="detail-label">Class:</span>
              <span className="detail-value">{test.className} - {test.section}</span>
            </div>
            {test.negativeMarking && (
              <div className="detail-item">
                <span className="detail-label">Negative Marking:</span>
                <span className="detail-value">Yes (-{test.negativeMarks} per wrong answer)</span>
              </div>
            )}
            <div className="detail-item">
              <span className="detail-label">Status:</span>
              <span className={`status-badge ${test.status || 'active'}`}>
                {test.status || 'Active'}
              </span>
            </div>
          </div>
        </div>

        <div className="analytics-grid">
          <div className="analytics-card card-blue">
            <div className="analytics-icon">
              <Users size={32} />
            </div>
            <div className="analytics-content">
              <h3>Total Students</h3>
              <p className="analytics-value">{analytics.totalStudents}</p>
            </div>
          </div>

          <div className="analytics-card card-green">
            <div className="analytics-icon">
              <CheckCircle size={32} />
            </div>
            <div className="analytics-content">
              <h3>Completed</h3>
              <p className="analytics-value">{analytics.completedCount}</p>
              <p className="analytics-subtext">
                {analytics.pendingCount} Pending
              </p>
            </div>
          </div>

          <div className="analytics-card card-purple">
            <div className="analytics-icon">
              <TrendingUp size={32} />
            </div>
            <div className="analytics-content">
              <h3>Average Score</h3>
              <p className="analytics-value">{analytics.averageScore}%</p>
            </div>
          </div>

          <div className="analytics-card card-orange">
            <div className="analytics-icon">
              <Award size={32} />
            </div>
            <div className="analytics-content">
              <h3>Pass Rate</h3>
              <p className="analytics-value">{analytics.passRate}%</p>
              <p className="analytics-subtext">
                {analytics.passCount} Pass / {analytics.failCount} Fail
              </p>
            </div>
          </div>
        </div>

        <div className="performance-grid">
          <div className="performance-card">
            <h2 className="performance-title">
              <Award size={24} />
              Top Performers
            </h2>
            
            {analytics.topPerformers.length > 0 ? (
              <div className="performers-list">
                {analytics.topPerformers.map((student, index) => (
                  <div key={index} className="performer-item top-performer">
                    <div className="performer-rank">{index + 1}</div>
                    <div className="performer-info">
                      <h4>{student.name || student.studentName || `Student ${index + 1}`}</h4>
                      <p>{student.rollNo || student.studentId || "N/A"}</p>
                    </div>
                    <div className="performer-score">
                      <span className="score-value">{student.score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-performers">
                <CheckCircle size={48} strokeWidth={1.5} opacity={0.3} />
                <p>No submissions yet</p>
                <p className="empty-subtext">Results will appear here once students complete the test</p>
              </div>
            )}
          </div>

          <div className="performance-card">
            <h2 className="performance-title">
              <AlertCircle size={24} />
              Needs Attention
            </h2>
            
            {analytics.needsAttention.length > 0 ? (
              <div className="performers-list">
                {analytics.needsAttention.map((student, index) => (
                  <div key={index} className="performer-item needs-attention">
                    <div className="performer-rank attention">{index + 1}</div>
                    <div className="performer-info">
                      <h4>{student.name || student.studentName || `Student ${index + 1}`}</h4>
                      <p>{student.rollNo || student.studentId || "N/A"}</p>
                    </div>
                    <div className="performer-score">
                      <span className="score-value low">{student.score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-performers">
                <CheckCircle size={48} strokeWidth={1.5} opacity={0.3} />
                <p>No data available yet</p>
                <p className="empty-subtext">Students performing below 50% will appear here</p>
              </div>
            )}
          </div>
        </div>

        <div className="score-distribution-card">
          <h2 className="distribution-title">
            <TrendingUp size={24} />
            Score Distribution
          </h2>
          <div className="distribution-stats">
            <div className="distribution-item">
              <span className="distribution-label">Highest Score</span>
              <span className="distribution-value high">{analytics.highestScore}%</span>
            </div>
            <div className="distribution-item">
              <span className="distribution-label">Average Score</span>
              <span className="distribution-value avg">{analytics.averageScore}%</span>
            </div>
            <div className="distribution-item">
              <span className="distribution-label">Lowest Score</span>
              <span className="distribution-value low">{analytics.lowestScore}%</span>
            </div>
          </div>
        </div>

        <div className="selected-students-card">
          <h2 className="students-title">
            <Users size={24} />
            Selected Students ({students.length})
          </h2>
          {students.length > 0 ? (
            <div className="students-grid">
              {students.map((student, index) => (
                <div key={student.id} className="student-item">
                  <div className="student-avatar">
                    {index + 1}
                  </div>
                  <div className="student-details">
                    <span className="student-name">{student.name || "Unknown Student"}</span>
                    <span className="student-roll">{student.rollNumber || student.studentId || "N/A"}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-performers">
              <Users size={48} strokeWidth={1.5} opacity={0.3} />
              <p>No students selected</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestInsights;