import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import StudentSidebar from "./StudentSidebar";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Award,
  TrendingUp,
  FileText,
  Clock,
  Calendar,
  Target,
  Eye,
  AlertCircle
} from "lucide-react";
import "../styles/ResultDetailsPage.css";

const ResultDetailsPage = () => {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [studentData, setStudentData] = useState(null);
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = sessionStorage.getItem("studentData");
    if (!data) {
      navigate("/");
      return;
    }

    const student = JSON.parse(data);
    setStudentData(student);

    // Check if result data was passed via state
    if (location.state?.resultData) {
      setResultData(location.state.resultData);
      setLoading(false);
    } else {
      fetchResultDetails(resultId);
    }
  }, [navigate, resultId, location.state]);

  const fetchResultDetails = async (submissionId) => {
    try {
      setLoading(true);

      // Fetch submission
      const submissionRef = doc(db, "submissions", submissionId);
      const submissionDoc = await getDoc(submissionRef);

      if (!submissionDoc.exists()) {
        console.error("Submission not found");
        setLoading(false);
        return;
      }

      const submission = submissionDoc.data();

      // Fetch test details
      const testRef = doc(db, "tests", submission.testId);
      const testDoc = await getDoc(testRef);

      if (!testDoc.exists()) {
        console.error("Test not found");
        setLoading(false);
        return;
      }

      const testData = testDoc.data();
      const questions = testData.questions || [];

      // Process responses
      let correctCount = 0;
      let totalMarks = 0;
      let obtainedMarks = 0;
      const processedResponses = [];

      if (submission.responses && Array.isArray(submission.responses)) {
        submission.responses.forEach((response, index) => {
          const question = questions[index];

          if (question) {
            const correctAnswer = question.correctAnswer;
            const userAnswer = response.userAnswer;
            const marks = question.marks || 1;

            totalMarks += marks;

            // Check if answer is correct - handle both number and string comparisons
            let isCorrect = false;
            if (userAnswer !== null && userAnswer !== undefined) {
              if (typeof correctAnswer === 'number' && typeof userAnswer === 'number') {
                isCorrect = correctAnswer === userAnswer;
              } else if (typeof correctAnswer === 'string' && typeof userAnswer === 'string') {
                isCorrect = correctAnswer.trim().toLowerCase() === userAnswer.trim().toLowerCase();
              } else {
                isCorrect = String(correctAnswer) === String(userAnswer);
              }
            }

            if (isCorrect) {
              correctCount++;
              obtainedMarks += marks;
            }

            processedResponses.push({
              questionIndex: index,
              questionText: question.questionText || question.question,
              options: question.options || [],
              userAnswer: userAnswer,
              correctAnswer: correctAnswer,
              isCorrect: isCorrect,
              marks: marks
            });
          }
        });
      }

      const totalQuestions = questions.length;
      const score = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

      setResultData({
        id: submissionDoc.id,
        testId: submission.testId,
        testName: testData.testName,
        className: testData.className,
        section: testData.section,
        submittedAt: submission.submittedAt || null,
        timeTaken: submission.timeTaken || 0,
        totalQuestions: totalQuestions,
        correctAnswers: correctCount,
        incorrectAnswers: totalQuestions - correctCount,
        obtainedMarks: obtainedMarks,
        totalMarks: totalMarks,
        score: score,
        responses: processedResponses,
        questions: questions,
        duration: testData.duration
      });

      setLoading(false);
    } catch (error) {
      console.error("Error fetching result details:", error);
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    
    let date;
    // Handle Firestore Timestamp
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } 
    // Handle Date object
    else if (timestamp instanceof Date) {
      date = timestamp;
    } 
    // Handle timestamp number or string
    else {
      date = new Date(timestamp);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "N/A";
    }
    
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatTime = (seconds) => {
    if (!seconds || seconds === 0) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreClass = (score) => {
    if (score >= 80) return "excellent";
    if (score >= 60) return "good";
    if (score >= 40) return "average";
    return "poor";
  };

  const getGradeLabel = (score) => {
    if (score >= 90) return "Outstanding";
    if (score >= 80) return "Excellent";
    if (score >= 70) return "Very Good";
    if (score >= 60) return "Good";
    if (score >= 50) return "Average";
    return "Needs Improvement";
  };

  if (loading) {
    return (
      <div className="result-details-layout">
        <StudentSidebar studentData={studentData} />
        <div className="result-details-main">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading result details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!resultData) {
    return (
      <div className="result-details-layout">
        <StudentSidebar studentData={studentData} />
        <div className="result-details-main">
          <div className="error-container">
            <AlertCircle size={48} />
            <h3>Result not found</h3>
            <button 
              className="back-btn"
              onClick={() => navigate("/student-dashboard/results")}
            >
              <ArrowLeft size={18} />
              Back to Results
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="result-details-layout">
      <StudentSidebar studentData={studentData} />

      <div className="result-details-main">
        <div className="result-details-header">
          <button
            className="back-button"
            onClick={() => navigate("/student-dashboard/results")}
          >
            <ArrowLeft size={20} />
            Back to Results
          </button>

          <div className="header-content">
            <h1>{resultData.testName}</h1>
            <div className="header-meta">
              <span className="meta-item">
                <Calendar size={16} />
                {formatDate(resultData.submittedAt)}
              </span>
              <span className="meta-item">
                <Clock size={16} />
                Time Taken: {formatTime(resultData.timeTaken)}
              </span>
              <span className="meta-item">
                {resultData.className} - {resultData.section}
              </span>
            </div>
          </div>
        </div>

        <div className="result-summary-section">
          <div className="summary-card score-card">
            <div className={`score-display ${getScoreClass(resultData.score)}`}>
              <div className="score-circle">
                <div className="score-value">{resultData.score.toFixed(1)}%</div>
                <div className="score-label">{getGradeLabel(resultData.score)}</div>
              </div>
            </div>
          </div>

          <div className="summary-stats">
            <div className="stat-box correct">
              <div className="stat-icon">
                <CheckCircle size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{resultData.correctAnswers}</div>
                <div className="stat-label">Correct Answers</div>
              </div>
            </div>

            <div className="stat-box incorrect">
              <div className="stat-icon">
                <XCircle size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{resultData.incorrectAnswers}</div>
                <div className="stat-label">Incorrect Answers</div>
              </div>
            </div>

            <div className="stat-box total">
              <div className="stat-icon">
                <FileText size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{resultData.totalQuestions}</div>
                <div className="stat-label">Total Questions</div>
              </div>
            </div>

            <div className="stat-box marks">
              <div className="stat-icon">
                <Target size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-value">
                  {resultData.obtainedMarks}/{resultData.totalMarks}
                </div>
                <div className="stat-label">Marks Obtained</div>
              </div>
            </div>
          </div>
        </div>

        <div className="answers-review-section">
          <div className="section-header">
            <Eye size={24} />
            <h2>Detailed Answer Review</h2>
          </div>

          <div className="questions-list">
            {resultData.responses && resultData.responses.map((response, index) => (
              <div
                key={index}
                className={`question-review-card ${
                  response.isCorrect ? "correct" : "incorrect"
                }`}
              >
                <div className="question-header">
                  <div className="question-number">
                    <span>Question {index + 1}</span>
                    <span className="question-marks">
                      {response.marks} Mark{response.marks > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className={`question-status ${response.isCorrect ? "correct" : "incorrect"}`}>
                    {response.isCorrect ? (
                      <>
                        <CheckCircle size={18} />
                        <span>Correct</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={18} />
                        <span>Incorrect</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="question-text">
                  {response.questionText}
                </div>

                <div className="options-list">
                  {response.options && response.options.map((option, optIndex) => {
                    const isUserAnswer = response.userAnswer === optIndex;
                    const isCorrectAnswer = response.correctAnswer === optIndex;
                    const isWrongAnswer = isUserAnswer && !response.isCorrect;

                    let optionClass = "option-item";
                    if (isCorrectAnswer) {
                      optionClass += " correct-option";
                    }
                    if (isWrongAnswer) {
                      optionClass += " wrong-option";
                    }
                    if (isUserAnswer && !isWrongAnswer) {
                      optionClass += " user-correct-option";
                    }

                    return (
                      <div key={optIndex} className={optionClass}>
                        <div className="option-indicator">
                          {String.fromCharCode(65 + optIndex)}
                        </div>
                        <div className="option-content">
                          <div className="option-text">{option}</div>
                          {isCorrectAnswer && (
                            <span className="option-badge correct-badge">
                              <CheckCircle size={14} />
                              Correct Answer
                            </span>
                          )}
                          {isWrongAnswer && (
                            <span className="option-badge wrong-badge">
                              <XCircle size={14} />
                              Your Answer
                            </span>
                          )}
                          {isUserAnswer && isCorrectAnswer && (
                            <span className="option-badge your-correct-badge">
                              <CheckCircle size={14} />
                              Your Correct Answer
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {response.userAnswer === null || response.userAnswer === undefined ? (
                  <div className="not-answered-alert">
                    <AlertCircle size={16} />
                    <span>You didn't answer this question</span>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="result-actions">
          <button
            className="btn-secondary"
            onClick={() => navigate("/student-dashboard/results")}
          >
            <ArrowLeft size={18} />
            Back to All Results
          </button>
          <button
            className="btn-primary"
            onClick={() => navigate("/student-dashboard")}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultDetailsPage;