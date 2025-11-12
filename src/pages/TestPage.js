import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import {
  Clock,
  BookOpen,
  Award,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  FileText,
  TrendingUp,
  Home,
  Eye
} from "lucide-react";
import "../styles/TestPage.css";

const TestPage = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [testData, setTestData] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const studentData = JSON.parse(sessionStorage.getItem("studentData"));

  useEffect(() => {
    fetchTestData();
  }, [testId]);

  useEffect(() => {
    if (timeRemaining > 0 && !testSubmitted) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining, testSubmitted]);

  const fetchTestData = async () => {
    try {
      const testDoc = await getDoc(doc(db, "tests", testId));
      if (testDoc.exists()) {
        const data = testDoc.data();
        console.log("Fetched test data:", data); // Debug log
        setTestData(data);
        setTimeRemaining(data.duration * 60); // Convert minutes to seconds
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching test:", error);
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    setAnswers({
      ...answers,
      [questionIndex]: optionIndex, // Store as NUMBER
    });
  };

  const handleSubmitTest = async () => {
    if (testSubmitted) return;

    try {
      setTestSubmitted(true);

      // Calculate score
      let correctAnswers = 0;
      let totalMarks = 0;
      let obtainedMarks = 0;

      const detailedAnswers = testData.questions.map((question, index) => {
        const userAnswer = answers[index]; // This is a NUMBER (0, 1, 2, 3) or undefined
        const correctAnswer = question.correctAnswer; // This should also be a NUMBER now
        
        console.log(`Q${index + 1}: User=${userAnswer}, Correct=${correctAnswer}, Type: User=${typeof userAnswer}, Correct=${typeof correctAnswer}`);
        
        // Compare as numbers - both should be numbers now
        const isCorrect = userAnswer !== undefined && userAnswer === correctAnswer;
        
        totalMarks += question.marks || 1;
        if (isCorrect) {
          correctAnswers++;
          obtainedMarks += question.marks || 1;
        }

        return {
          questionIndex: index,
          questionText: question.question || question.questionText,
          options: question.options,
          userAnswer: userAnswer !== undefined ? userAnswer : null,
          correctAnswer: correctAnswer,
          isCorrect,
          marks: question.marks || 1,
        };
      });

      const percentage = (obtainedMarks / totalMarks) * 100;

      console.log("Test Results:", {
        correctAnswers,
        totalQuestions: testData.questions.length,
        percentage,
        obtainedMarks,
        totalMarks
      });

      // Save submission to Firestore
      const submissionData = {
        testId,
        testName: testData.testName,
        studentId: studentData.id,
        studentName: studentData.name,
        answers: detailedAnswers,
        responses: detailedAnswers, // Add this for compatibility with MyResults
        score: percentage,
        correctAnswers,
        totalQuestions: testData.questions.length,
        obtainedMarks,
        totalMarks,
        submittedAt: serverTimestamp(),
        timeTaken: testData.duration * 60 - timeRemaining,
      };

      await addDoc(collection(db, "submissions"), submissionData);

      setTestResult(submissionData);
    } catch (error) {
      console.error("Error submitting test:", error);
      alert("Error submitting test. Please try again.");
      setTestSubmitted(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading test...</p>
      </div>
    );
  }

  if (testSubmitted && testResult) {
    return (
      <div className="test-page-container">
        <div className="test-report-container">
          <div className="report-header">
            <div className="success-icon">
              <CheckCircle size={40} />
            </div>
            <h1>Test Completed!</h1>
            <p>Great job! Here's your performance summary</p>
          </div>

          <div className="score-summary">
            <div className="score-card total">
              <div className="score-card-icon">
                <FileText size={28} />
              </div>
              <div className="score-value">{testResult.totalQuestions}</div>
              <div className="score-label">Total Questions</div>
            </div>

            <div className="score-card correct">
              <div className="score-card-icon">
                <CheckCircle size={28} />
              </div>
              <div className="score-value">{testResult.correctAnswers}</div>
              <div className="score-label">Correct Answers</div>
            </div>

            <div className="score-card incorrect">
              <div className="score-card-icon">
                <XCircle size={28} />
              </div>
              <div className="score-value">
                {testResult.totalQuestions - testResult.correctAnswers}
              </div>
              <div className="score-label">Incorrect Answers</div>
            </div>

            <div className="score-card percentage">
              <div className="score-card-icon">
                <TrendingUp size={28} />
              </div>
              <div className="score-value">{testResult.score.toFixed(1)}%</div>
              <div className="score-label">Your Score</div>
            </div>
          </div>

          <div className="answers-review">
            <div className="review-header">
              <Eye size={24} />
              <h2>Answer Review</h2>
            </div>

            {testResult.answers.map((answer, index) => (
              <div
                key={index}
                className={`review-question ${
                  answer.isCorrect ? "correct" : "incorrect"
                }`}
              >
                <div className="review-question-header">
                  <span className="review-question-number">
                    Question {index + 1} • {answer.marks} Mark{answer.marks > 1 ? "s" : ""}
                  </span>
                  <span
                    className={`review-status ${
                      answer.isCorrect ? "correct" : "incorrect"
                    }`}
                  >
                    {answer.isCorrect ? (
                      <>
                        <CheckCircle size={16} /> Correct
                      </>
                    ) : (
                      <>
                        <XCircle size={16} /> Incorrect
                      </>
                    )}
                  </span>
                </div>

                <div className="review-question-text">{answer.questionText}</div>

                <div className="review-options">
                  {answer.options.map((option, optIndex) => {
                    const isUserAnswer = answer.userAnswer === optIndex;
                    const isCorrectAnswer = answer.correctAnswer === optIndex;
                    const isWrongAnswer = isUserAnswer && !answer.isCorrect;

                    let className = "review-option";
                    if (isCorrectAnswer) className += " correct-answer";
                    if (isWrongAnswer) className += " wrong-answer";
                    if (isUserAnswer && answer.isCorrect) className += " user-answer correct-answer";

                    return (
                      <div key={optIndex} className={className}>
                        {isUserAnswer && !isCorrectAnswer && (
                          <span className="option-label">Your Answer</span>
                        )}
                        {isCorrectAnswer && (
                          <span className="option-label">Correct Answer</span>
                        )}
                        {option}
                      </div>
                    );
                  })}
                  {answer.userAnswer === null && (
                    <div className="review-option wrong-answer">
                      <span className="option-label">Not Answered</span>
                      You didn't select any option
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="report-actions">
            <button
              className="btn btn-primary"
              onClick={() => navigate("/student-dashboard")}
            >
              <Home size={20} />
              Back to Dashboard
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate("/student-dashboard/results")}
            >
              <Award size={20} />
              View All Results
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = testData?.questions[currentQuestionIndex];

  return (
    <div className="test-page-container">
      <div className="test-wrapper">
        <div className="test-header">
          <div className="test-info">
            <h1>{testData?.testName}</h1>
            <div className="test-meta-info">
              <div className="meta-item">
                <BookOpen size={18} />
                <span>
                  {testData?.className} - {testData?.section}
                </span>
              </div>
              <div className="meta-item">
                <FileText size={18} />
                <span>{testData?.questions?.length} Questions</span>
              </div>
            </div>
          </div>
          <div className={`timer-display ${timeRemaining < 300 ? "warning" : ""}`}>
            <Clock size={28} />
            <span className="timer-text">{formatTime(timeRemaining)}</span>
          </div>
        </div>

        <div className="test-content">
          <div className="question-navigation">
            {testData?.questions.map((_, index) => (
              <button
                key={index}
                className={`question-nav-item ${
                  currentQuestionIndex === index ? "active" : ""
                } ${answers[index] !== undefined ? "answered" : ""}`}
                onClick={() => setCurrentQuestionIndex(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {currentQuestion && (
            <div className="question-container">
              <div className="question-header">
                <span className="question-number">
                  Question {currentQuestionIndex + 1} of {testData.questions.length}
                </span>
                <span className="question-marks">
                  {currentQuestion.marks || 1} Mark{(currentQuestion.marks || 1) > 1 ? "s" : ""}
                </span>
              </div>

              <div className="question-text">{currentQuestion.question || currentQuestion.questionText}</div>

              <div className="options-container">
                {currentQuestion.options.map((option, index) => (
                  <div
                    key={index}
                    className={`option-item ${
                      answers[currentQuestionIndex] === index ? "selected" : ""
                    }`}
                    onClick={() => handleAnswerSelect(currentQuestionIndex, index)}
                  >
                    <div className="option-radio"></div>
                    <span>{option}</span>
                  </div>
                ))}
              </div>

              <div className="test-actions">
                <div className="navigation-buttons">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                    disabled={currentQuestionIndex === 0}
                  >
                    <ChevronLeft size={20} />
                    Previous
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                    disabled={currentQuestionIndex === testData.questions.length - 1}
                  >
                    Next
                    <ChevronRight size={20} />
                  </button>
                </div>

                {currentQuestionIndex === testData.questions.length - 1 && (
                  <button className="btn btn-submit" onClick={handleSubmitTest}>
                    <CheckCircle size={20} />
                    Submit Test
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestPage;