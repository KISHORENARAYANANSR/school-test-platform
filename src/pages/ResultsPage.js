import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import StudentSidebar from "./StudentSidebar";
import {
  Award,
  TrendingUp,
  Target,
  BookOpen,
  Calendar,
  Clock,
  Eye,
  Trophy,
} from "lucide-react";
import "../styles/ResultsPage.css";

const ResultsPage = () => {
  const [studentData, setStudentData] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTests: 0,
    averageScore: 0,
    highestScore: 0,
  });
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
      const q = query(
        submissionsRef,
        where("studentId", "==", student.id)
      );

      const submissionsSnapshot = await getDocs(q);
      const resultsData = [];

      for (const submissionDoc of submissionsSnapshot.docs) {
        const submission = submissionDoc.data();

        // Fetch the test details to get correct answers
        const testRef = doc(db, "tests", submission.testId);
        const testDoc = await getDoc(testRef);

        if (testDoc.exists()) {
          const testData = testDoc.data();
          const questions = testData.questions || [];

          // Process responses and verify with correct answers
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

                // Check if answer is correct - both should be numbers now
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
                  userAnswer: userAnswer,
                  correctAnswer: correctAnswer,
                  isCorrect: isCorrect,
                  marks: marks,
                  options: question.options || []
                });
              }
            });
          }

          // Calculate score percentage
          const totalQuestions = questions.length;
          const score = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

          resultsData.push({
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
        }
      }

      // Sort by submission date (newest first)
      resultsData.sort((a, b) => {
        if (!a.submittedAt) return 1;
        if (!b.submittedAt) return -1;
        
        // Handle different timestamp formats
        const dateA = a.submittedAt.toDate ? a.submittedAt.toDate() : new Date(a.submittedAt);
        const dateB = b.submittedAt.toDate ? b.submittedAt.toDate() : new Date(b.submittedAt);
        
        return dateB - dateA;
      });

      setResults(resultsData);

      // Calculate stats
      if (resultsData.length > 0) {
        const totalScore = resultsData.reduce((sum, result) => sum + result.score, 0);
        const avgScore = totalScore / resultsData.length;
        const maxScore = Math.max(...resultsData.map((r) => r.score));

        setStats({
          totalTests: resultsData.length,
          averageScore: avgScore.toFixed(1),
          highestScore: maxScore.toFixed(1),
        });
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching results:", error);
      setLoading(false);
    }
  };

  const getScoreClass = (score) => {
    if (score >= 80) return "excellent";
    if (score >= 60) return "good";
    if (score >= 40) return "average";
    return "poor";
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
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (seconds) => {
    if (!seconds || seconds === 0) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleViewDetails = (result) => {
    navigate(`/student-dashboard/result/${result.id}`, {
      state: { resultData: result }
    });
  };

  if (loading) {
    return (
      <div className="results-page-layout">
        <StudentSidebar studentData={studentData} />
        <div className="results-main">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading your results...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="results-page-layout">
      <StudentSidebar studentData={studentData} />

      <div className="results-main">
        <div className="results-header">
          <div>
            <h1>My Results 🏆</h1>
            <p>Track your performance and progress</p>
          </div>
        </div>

        {results.length > 0 && (
          <div className="results-stats">
            <div className="stat-box tests-taken">
              <div className="stat-box-icon">
                <BookOpen size={24} />
              </div>
              <div className="stat-box-value">{stats.totalTests}</div>
              <div className="stat-box-label">Tests Taken</div>
            </div>

            <div className="stat-box avg-score">
              <div className="stat-box-icon">
                <TrendingUp size={24} />
              </div>
              <div className="stat-box-value">{stats.averageScore}%</div>
              <div className="stat-box-label">Average Score</div>
            </div>

            <div className="stat-box highest">
              <div className="stat-box-icon">
                <Trophy size={24} />
              </div>
              <div className="stat-box-value">{stats.highestScore}%</div>
              <div className="stat-box-label">Highest Score</div>
            </div>
          </div>
        )}

        {results.length === 0 ? (
          <div className="empty-results">
            <Award size={64} />
            <h3>No Results Yet</h3>
            <p>Complete tests to see your results here</p>
          </div>
        ) : (
          <div className="results-grid">
            {results.map((result) => (
              <div key={result.id} className="result-card">
                <div className="result-card-header">
                  <h3 className="result-test-name">{result.testName}</h3>
                  <div className="result-test-meta">
                    <span>
                      <Calendar size={14} />
                      {formatDate(result.submittedAt)}
                    </span>
                    <span>
                      <Clock size={14} />
                      {formatTime(result.timeTaken)}
                    </span>
                  </div>
                </div>

                <div className="result-card-body">
                  <div className="result-score-display">
                    <div className={`score-circle ${getScoreClass(result.score)}`}>
                      <div className="score-percentage">
                        {result.score.toFixed(1)}%
                      </div>
                      <div className="score-label">Score</div>
                    </div>
                  </div>

                  <div className="result-details">
                    <div className="detail-item">
                      <div className="detail-value">{result.correctAnswers}</div>
                      <div className="detail-label">Correct</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-value">{result.incorrectAnswers}</div>
                      <div className="detail-label">Incorrect</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-value">{result.obtainedMarks}</div>
                      <div className="detail-label">Obtained</div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-value">{result.totalMarks}</div>
                      <div className="detail-label">Total Marks</div>
                    </div>
                  </div>

                  <div className="result-actions">
                    <button
                      className="view-details-btn"
                      onClick={() => handleViewDetails(result)}
                    >
                      <Eye size={18} />
                      View Detailed Review
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsPage;