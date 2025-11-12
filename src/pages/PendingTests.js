import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import StudentSidebar from "../pages/StudentSidebar";
import { 
  ClipboardList, 
  Clock, 
  BookOpen,
  AlertCircle,
  Calendar,
  Award
} from "lucide-react";
import "../styles/PendingTests.css";

const PendingTests = () => {
  const [studentData, setStudentData] = useState(null);
  const [pendingTests, setPendingTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const data = sessionStorage.getItem("studentData");
    if (!data) {
      navigate("/");
      return;
    }

    const student = JSON.parse(data);
    setStudentData(student);
    fetchPendingTests(student);
  }, [navigate]);

  const fetchPendingTests = async (student) => {
    try {
      setLoading(true);

      const testsRef = collection(db, "tests");
      const testsSnapshot = await getDocs(testsRef);
      const studentPendingTests = [];

      for (const testDoc of testsSnapshot.docs) {
        const testData = testDoc.data();
        if (
          testData.selectedStudents &&
          testData.selectedStudents.includes(student.id) &&
          testData.status === "active"
        ) {
          // Check if student has already completed this test
          const submissionsRef = collection(db, "submissions");
          const q = query(
            submissionsRef,
            where("testId", "==", testDoc.id),
            where("studentId", "==", student.id)
          );
          const submissionSnapshot = await getDocs(q);

          if (submissionSnapshot.empty) {
            studentPendingTests.push({ id: testDoc.id, ...testData });
          }
        }
      }

      // Sort by creation date (newest first)
      studentPendingTests.sort((a, b) => {
        const dateA = a.createdAt?.toDate() || new Date(0);
        const dateB = b.createdAt?.toDate() || new Date(0);
        return dateB - dateA;
      });

      setPendingTests(studentPendingTests);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching pending tests:", error);
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate();
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleStartTest = (testId) => {
    navigate(`/student-dashboard/test/${testId}`);
  };

  if (loading) {
    return (
      <div className="student-dashboard-layout">
        <StudentSidebar studentData={studentData} />
        <div className="dashboard-main">
          <div className="loading-container">
            <div className="spinner-large"></div>
            <p>Loading pending tests...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="student-dashboard-layout">
      <StudentSidebar studentData={studentData} />
      
      <div className="dashboard-main">
        <div className="page-header">
          <div className="header-content">
            <ClipboardList size={32} />
            <div>
              <h1>Pending Tests</h1>
              <p>Complete your pending assessments</p>
            </div>
          </div>
          <div className="tests-count-badge">
            {pendingTests.length} {pendingTests.length === 1 ? "Test" : "Tests"}
          </div>
        </div>

        <div className="pending-tests-container">
          {pendingTests.length === 0 ? (
            <div className="empty-state-large">
              <div className="empty-icon">
                <ClipboardList size={64} />
              </div>
              <h2>No Pending Tests</h2>
              <p>You're all caught up! Check back later for new assessments.</p>
            </div>
          ) : (
            <div className="tests-grid">
              {pendingTests.map((test) => (
                <div key={test.id} className="test-card">
                  <div className="test-card-header">
                    <div className="test-header-left">
                      <div className="test-icon-badge">
                        <ClipboardList size={20} />
                      </div>
                      <div>
                        <h3>{test.testName}</h3>
                        <p className="test-class-info">
                          {test.className} - {test.section}
                        </p>
                      </div>
                    </div>
                    <span className="status-badge active">Active</span>
                  </div>

                  <div className="test-card-body">
                    <div className="test-info-grid">
                      <div className="info-item">
                        <Clock size={18} />
                        <div>
                          <span className="info-label">Duration</span>
                          <span className="info-value">{test.duration} minutes</span>
                        </div>
                      </div>

                      <div className="info-item">
                        <BookOpen size={18} />
                        <div>
                          <span className="info-label">Questions</span>
                          <span className="info-value">{test.questions?.length || 0}</span>
                        </div>
                      </div>

                      <div className="info-item">
                        <Award size={18} />
                        <div>
                          <span className="info-label">Total Marks</span>
                          <span className="info-value">{test.totalMarks || 0}</span>
                        </div>
                      </div>

                      <div className="info-item">
                        <Calendar size={18} />
                        <div>
                          <span className="info-label">Created</span>
                          <span className="info-value">{formatDate(test.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {test.negativeMarking && (
                      <div className="warning-banner">
                        <AlertCircle size={16} />
                        <span>Negative marking enabled: -{test.negativeMarks} per wrong answer</span>
                      </div>
                    )}
                  </div>

                  <div className="test-card-footer">
                    <button 
                      className="start-test-button"
                      onClick={() => handleStartTest(test.id)}
                    >
                      <ClipboardList size={18} />
                      <span>Start Test</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PendingTests;