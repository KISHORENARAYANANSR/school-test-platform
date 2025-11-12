import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import StudentSidebar from "../pages/StudentSidebar";
import {
  FileText,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  ChevronRight,
  BarChart3,
  Calendar
} from "lucide-react";
import "../styles/MyResults.css";

const MyResults = () => {
  const [studentData, setStudentData] = useState(null);
  const [results, setResults] = useState([]);
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
    fetchResults(student);
  }, [navigate]);

  const fetchResults = async (student) => {
    try {
      setLoading(true);

      // Fetch all submissions for this student
      const submissionsRef = collection(db, "submissions");
      const q = query(submissionsRef, where("studentId", "==", student.id));
      const submissionsSnapshot = await getDocs(q);

      const resultsData = [];

      for (const submissionDoc of submissionsSnapshot.docs) {
        const submission = submissionDoc.data();

        // Fetch the test details
        const testRef = doc(db, "tests", submission.testId);
        const testDoc = await getDoc(testRef);

        if (testDoc.exists()) {
          const testData = testDoc.data();
          const questions = testData.questions || [];

          // Process responses and check correctness
          const processedResponses = [];
          let correctCount = 0;

          if (submission.responses && Array.isArray(submission.responses)) {
            submission.responses.forEach((response, index) => {
              const question = questions[index];
              
              if (question) {
                // Get the correct answer from the test
                const correctAnswer = question.correctAnswer;
                const userAnswer = response.userAnswer;

                // Check if answer is correct
                let isCorrect = false;
                
                // Handle different answer formats
                if (typeof correctAnswer === 'string' && typeof userAnswer === 'string') {
                  // Direct string comparison (trim and lowercase for better matching)
                  isCorrect = correctAnswer.trim().toLowerCase() === userAnswer.trim().toLowerCase();
                } else if (typeof correctAnswer === 'number' && typeof userAnswer === 'number') {
                  // Number comparison
                  isCorrect = correctAnswer === userAnswer;
                } else if (correctAnswer !== undefined && userAnswer !== undefined) {
                  // Generic comparison
                  isCorrect = String(correctAnswer) === String(userAnswer);
                }

                if (isCorrect) {
                  correctCount++;
                }

                processedResponses.push({
                  questionIndex: index,
                  questionText: question.questionText,
                  userAnswer: userAnswer,
                  correctAnswer: correctAnswer,
                  isCorrect: isCorrect,
                  options: question.options || [],
                  marks: question.marks || 1
                });
              }
            });
          }

          // Calculate statistics
          const totalQuestions = questions.length;
          const incorrectCount = totalQuestions - correctCount;
          const percentage = totalQuestions > 0 
            ? ((correctCount / totalQuestions) * 100).toFixed(1)
            : 0;

          // Calculate total marks
          const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);
          const obtainedMarks = processedResponses
            .filter(r => r.isCorrect)
            .reduce((sum, r) => sum + r.marks, 0);

          resultsData.push({
            id: submissionDoc.id,
            submissionId: submissionDoc.id,
            testId: submission.testId,
            testName: testData.testName,
            className: testData.className,
            section: testData.section,
            submittedAt: submission.submittedAt?.toDate() || new Date(),
            totalQuestions,
            correctAnswers: correctCount,
            incorrectAnswers: incorrectCount,
            score: percentage,
            obtainedMarks,
            totalMarks,
            responses: processedResponses,
            questions: questions,
            duration: testData.duration
          });
        }
      }

      // Sort by submission date (newest first)
      resultsData.sort((a, b) => b.submittedAt - a.submittedAt);

      setResults(resultsData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching results:", error);
      setLoading(false);
    }
  };

  const handleViewDetails = (result) => {
    navigate(`/student-dashboard/my-result/${result.submissionId}`, { 
      state: { resultData: result } 
    });
  };

  const getGradeColor = (score) => {
    if (score >= 90) return "excellent";
    if (score >= 75) return "good";
    if (score >= 60) return "average";
    return "poor";
  };

  const getGradeLabel = (score) => {
    if (score >= 90) return "Excellent";
    if (score >= 75) return "Good";
    if (score >= 60) return "Average";
    return "Needs Improvement";
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  };

  if (loading) {
    return (
      <div className="my-results-loading-state">
        <div className="my-results-spinner-large"></div>
        <p>Loading your results...</p>
      </div>
    );
  }

  return (
    <div className="my-results-layout">
      <StudentSidebar studentData={studentData} />

      <div className="my-results-main-content">
        <div className="my-results-page-header">
          <div className="my-results-header-content">
            <div className="my-results-header-icon">
              <Award size={32} />
            </div>
            <div>
              <h1>My Results</h1>
              <p>View your test performance and detailed analytics</p>
            </div>
          </div>
          <div className="my-results-stats-summary">
            <div className="my-results-summary-item">
              <FileText size={20} />
              <div>
                <span className="my-results-summary-value">{results.length}</span>
                <span className="my-results-summary-label">Tests Taken</span>
              </div>
            </div>
            <div className="my-results-summary-item">
              <TrendingUp size={20} />
              <div>
                <span className="my-results-summary-value">
                  {results.length > 0
                    ? (
                        results.reduce((acc, r) => acc + parseFloat(r.score), 0) /
                        results.length
                      ).toFixed(1)
                    : 0}
                  %
                </span>
                <span className="my-results-summary-label">Avg Score</span>
              </div>
            </div>
          </div>
        </div>

        {results.length === 0 ? (
          <div className="my-results-empty-state">
            <div className="my-results-empty-icon">
              <FileText size={64} />
            </div>
            <h3>No Results Yet</h3>
            <p>You haven't completed any tests yet. Start taking tests to see your results here!</p>
          </div>
        ) : (
          <div className="my-results-grid">
            {results.map((result) => (
              <div 
                key={result.id} 
                className={`my-results-card ${getGradeColor(result.score)}`}
              >
                <div className="my-results-card-header">
                  <div className="my-results-test-info">
                    <h3>{result.testName}</h3>
                    <div className="my-results-test-meta">
                      <span className="my-results-class-badge">
                        {result.className} - {result.section}
                      </span>
                      <span className="my-results-date">
                        <Calendar size={14} />
                        {formatDate(result.submittedAt)}
                      </span>
                    </div>
                  </div>
                  <div className={`my-results-score-badge ${getGradeColor(result.score)}`}>
                    <span className="my-results-score-value">{result.score}%</span>
                    <span className="my-results-grade-label">{getGradeLabel(result.score)}</span>
                    <span className="my-results-marks-label">{result.obtainedMarks}/{result.totalMarks}</span>
                  </div>
                </div>

                <div className="my-results-card-body">
                  <div className="my-results-stats-row">
                    <div className="my-results-stat-item">
                      <div className="my-results-stat-icon correct">
                        <CheckCircle size={18} />
                      </div>
                      <div className="my-results-stat-details">
                        <span className="my-results-stat-value">{result.correctAnswers}</span>
                        <span className="my-results-stat-label">Correct</span>
                      </div>
                    </div>

                    <div className="my-results-stat-item">
                      <div className="my-results-stat-icon incorrect">
                        <XCircle size={18} />
                      </div>
                      <div className="my-results-stat-details">
                        <span className="my-results-stat-value">{result.incorrectAnswers}</span>
                        <span className="my-results-stat-label">Incorrect</span>
                      </div>
                    </div>

                    <div className="my-results-stat-item">
                      <div className="my-results-stat-icon total">
                        <BarChart3 size={18} />
                      </div>
                      <div className="my-results-stat-details">
                        <span className="my-results-stat-value">{result.totalQuestions}</span>
                        <span className="my-results-stat-label">Total</span>
                      </div>
                    </div>

                    <div className="my-results-stat-item">
                      <div className="my-results-stat-icon duration">
                        <Clock size={18} />
                      </div>
                      <div className="my-results-stat-details">
                        <span className="my-results-stat-value">{result.duration}</span>
                        <span className="my-results-stat-label">Minutes</span>
                      </div>
                    </div>
                  </div>

                  <div className="my-results-progress-bar">
                    <div 
                      className="my-results-progress-fill"
                      style={{ width: `${result.score}%` }}
                    ></div>
                  </div>

                  <button 
                    className="my-results-view-details-btn"
                    onClick={() => handleViewDetails(result)}
                  >
                    <span>View Detailed Report</span>
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyResults;