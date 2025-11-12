import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import StudentSidebar from "../pages/StudentSidebar";
import { 
  BookOpen, 
  ClipboardList, 
  Award, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import "../styles/StudentDashboard.css";

const StudentDashboard = () => {
  const [studentData, setStudentData] = useState(null);
  const [classes, setClasses] = useState([]);
  const [pendingTests, setPendingTests] = useState([]);
  const [stats, setStats] = useState({
    totalClasses: 0,
    pendingTests: 0,
    completedTests: 0,
    averageScore: 0,
  });
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
    fetchStudentData(student);
  }, [navigate]);

  const fetchStudentData = async (student) => {
    try {
      setLoading(true);

      // Fetch all classes
      const classesRef = collection(db, "classes");
      const classesSnapshot = await getDocs(classesRef);
      const allClasses = [];

      for (const classDoc of classesSnapshot.docs) {
        const classData = classDoc.data();
        if (classData.students && classData.students.includes(student.id)) {
          allClasses.push({ id: classDoc.id, ...classData });
        }
      }

      setClasses(allClasses);

      // Fetch pending tests
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

      setPendingTests(studentPendingTests);

      // Calculate stats
      const submissionsRef = collection(db, "submissions");
      const studentSubmissionsQuery = query(
        submissionsRef,
        where("studentId", "==", student.id)
      );
      const submissionsSnapshot = await getDocs(studentSubmissionsQuery);
      
      let totalScore = 0;
      const completedCount = submissionsSnapshot.size;

      submissionsSnapshot.forEach((doc) => {
        const submission = doc.data();
        if (submission.score !== undefined) {
          totalScore += submission.score;
        }
      });

      const avgScore = completedCount > 0 ? (totalScore / completedCount).toFixed(1) : 0;

      setStats({
        totalClasses: allClasses.length,
        pendingTests: studentPendingTests.length,
        completedTests: completedCount,
        averageScore: avgScore,
      });

      setLoading(false);
    } catch (error) {
      console.error("Error fetching student data:", error);
      setLoading(false);
    }
  };

  const handleViewPendingTests = () => {
    navigate("/student-dashboard/pending-tests");
  };

  if (loading) {
    return (
      <div className="student-dashboard-loading-state">
        <div className="student-dashboard-spinner-large"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="student-main-dashboard-layout">
      <StudentSidebar studentData={studentData} />
      
      <div className="student-dashboard-main-content">
        <div className="student-dashboard-welcome-header">
          <div>
            <h1>Welcome back, {studentData?.name}! 👋</h1>
            <p>Here's your academic overview</p>
          </div>
        </div>

        <div className="student-dashboard-stats-grid">
          <div className="student-dashboard-stat-card green">
            <div className="student-dashboard-stat-icon">
              <BookOpen size={24} />
            </div>
            <div className="student-dashboard-stat-content">
              <h3>{stats.totalClasses}</h3>
              <p>Total Classes</p>
            </div>
          </div>

          <div className="student-dashboard-stat-card coral">
            <div className="student-dashboard-stat-icon">
              <Clock size={24} />
            </div>
            <div className="student-dashboard-stat-content">
              <h3>{stats.pendingTests}</h3>
              <p>Pending Tests</p>
            </div>
          </div>

          <div className="student-dashboard-stat-card emerald">
            <div className="student-dashboard-stat-icon">
              <CheckCircle size={24} />
            </div>
            <div className="student-dashboard-stat-content">
              <h3>{stats.completedTests}</h3>
              <p>Completed Tests</p>
            </div>
          </div>

          <div className="student-dashboard-stat-card amber">
            <div className="student-dashboard-stat-icon">
              <TrendingUp size={24} />
            </div>
            <div className="student-dashboard-stat-content">
              <h3>{stats.averageScore}%</h3>
              <p>Average Score</p>
            </div>
          </div>
        </div>

        <div className="student-dashboard-content-wrapper">
          <div className="student-dashboard-content-section">
            <div className="student-dashboard-section-header">
              <div className="student-dashboard-header-left">
                <BookOpen size={24} />
                <h2>My Classes</h2>
              </div>
            </div>

            {classes.length === 0 ? (
              <div className="student-dashboard-empty-state">
                <AlertCircle size={48} />
                <h3>No Classes Found</h3>
                <p>You are not enrolled in any classes yet.</p>
              </div>
            ) : (
              <div className="student-dashboard-classes-grid">
                {classes.map((classItem) => (
                  <div key={classItem.id} className="student-dashboard-class-card">
                    <div className="student-dashboard-class-card-header">
                      <h3>{classItem.name}</h3>
                      <span className="student-dashboard-class-badge">{classItem.section}</span>
                    </div>
                    <div className="student-dashboard-class-card-body">
                      <div className="student-dashboard-class-info-row">
                        <span className="student-dashboard-info-label">Grade:</span>
                        <span className="student-dashboard-info-value">{classItem.grade}</span>
                      </div>
                      <div className="student-dashboard-class-info-row">
                        <span className="student-dashboard-info-label">Subject:</span>
                        <span className="student-dashboard-info-value">
                          {classItem.mappings?.[0]?.subject || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="student-dashboard-content-section">
            <div className="student-dashboard-section-header">
              <div className="student-dashboard-header-left">
                <ClipboardList size={24} />
                <h2>Pending Tests</h2>
              </div>
              {pendingTests.length > 0 && (
                <button className="student-dashboard-view-all-btn" onClick={handleViewPendingTests}>
                  <span>View All</span>
                </button>
              )}
            </div>

            {pendingTests.length === 0 ? (
              <div className="student-dashboard-empty-state">
                <CheckCircle size={48} />
                <h3>No Pending Tests</h3>
                <p>You're all caught up! No tests pending at the moment.</p>
              </div>
            ) : (
              <div className="student-dashboard-tests-list">
                {pendingTests.slice(0, 3).map((test) => (
                  <div key={test.id} className="student-dashboard-test-item">
                    <div className="student-dashboard-test-icon">
                      <ClipboardList size={20} />
                    </div>
                    <div className="student-dashboard-test-details">
                      <h4>{test.testName}</h4>
                      <div className="student-dashboard-test-meta">
                        <span className="student-dashboard-test-class">{test.className} - {test.section}</span>
                        <span className="student-dashboard-test-duration">
                          <Clock size={14} />
                          {test.duration} mins
                        </span>
                      </div>
                    </div>
                    <button 
                      className="student-dashboard-start-test-btn"
                      onClick={() => navigate(`/student-dashboard/test/${test.id}`)}
                    >
                      <span>Start Test</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;