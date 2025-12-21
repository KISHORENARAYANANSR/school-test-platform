import React, { useState, useEffect, useRef } from "react";
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
  Eye,
  Edit3
} from "lucide-react";
import "../styles/TestPage.css";

// -------------------------------------------------------------------------
// 🎨 CONTENT RENDERER COMPONENT - FIXED FOR IMAGES
// -------------------------------------------------------------------------
const ContentRenderer = ({ content }) => {
  const contentRef = useRef(null);

  useEffect(() => {
    if (contentRef.current && content?.type === 'latex' && window.katex) {
      try {
        let latex = content.data.replace(/`/g, '').replace(/\$/g, '');
        window.katex.render(latex, contentRef.current, {
          throwOnError: false,
          displayMode: true,
        });
      } catch (err) {
        console.error('KaTeX rendering error:', err);
      }
    }
  }, [content]);

  // Handle null/undefined
  if (!content) {
    return <div className="content-text">No content</div>;
  }

  // If it's a plain string, just display it
  if (typeof content === 'string') {
    return <div className="content-text">{content}</div>;
  }

  // If it's not an object, convert to string
  if (typeof content !== 'object') {
    return <div className="content-text">{String(content)}</div>;
  }

  // Handle combined content (text + formula)
  if (content.type === 'combined') {
    return (
      <div className="content-combined">
        <ContentRenderer content={content.text} />
        {content.formula && content.formula.data && (
          <ContentRenderer content={content.formula} />
        )}
      </div>
    );
  }

  // Handle image - CRITICAL FIX
  if (content.type === 'image' && content.data) {
    return (
      <div className="content-image">
        <img 
          src={content.data} 
          alt="Question Image" 
          style={{ 
            maxWidth: '100%', 
            maxHeight: '400px',
            height: 'auto', 
            borderRadius: '8px',
            display: 'block',
            margin: '0 auto',
            objectFit: 'contain'
          }} 
          onError={(e) => {
            console.error('Image failed to load');
            e.target.style.display = 'none';
          }}
        />
      </div>
    );
  }

  // Handle LaTeX
  if (content.type === 'latex') {
    return (
      <div className="content-latex" ref={contentRef}>
        {content.data}
      </div>
    );
  }

  // Handle text type
  if (content.type === 'text') {
    return <div className="content-text">{content.data || ''}</div>;
  }

  // Fallback: If object has 'data' property, use it
  if (content.data !== undefined) {
    return <div className="content-text">{content.data}</div>;
  }

  // Last resort: show error message
  console.error("Unknown content format:", content);
  return <div className="content-text" style={{color: '#999', fontStyle: 'italic'}}>Content format error</div>;
};

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

  // Load KaTeX
  useEffect(() => {
    if (!window.katex) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js';
      script.async = true;
      document.head.appendChild(script);

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
      document.head.appendChild(link);
    }
  }, []);

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
        console.log("✅ Fetched test data:", data);
        setTestData(data);
        setTimeRemaining(data.duration * 60);
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
      [questionIndex]: optionIndex,
    });
  };

  const handleTextAnswerChange = (questionIndex, textValue) => {
    setAnswers({
      ...answers,
      [questionIndex]: textValue,
    });
  };

  const handleSubmitTest = async () => {
    if (testSubmitted) return;

    try {
      setTestSubmitted(true);

      let correctAnswers = 0;
      let totalMarks = 0;
      let obtainedMarks = 0;

      const detailedAnswers = testData.questions.map((question, index) => {
        const userAnswer = answers[index];
        const marks = question.marks || 1;
        
        totalMarks += marks;
        
        let isCorrect = false;

        if (question.questionType === "text") {
          const correctAnswer = question.correctAnswer;
          if (userAnswer !== undefined && userAnswer !== null) {
            const userAnswerStr = String(userAnswer).trim().toLowerCase();
            const correctAnswerStr = String(correctAnswer).trim().toLowerCase();
            isCorrect = userAnswerStr === correctAnswerStr;
          }
        } else {
          const correctAnswer = question.correctAnswer;
          isCorrect = userAnswer !== undefined && userAnswer === correctAnswer;
        }
        
        if (isCorrect) {
          correctAnswers++;
          obtainedMarks += marks;
        } else if (userAnswer !== undefined && userAnswer !== null && testData.negativeMarking) {
          obtainedMarks -= testData.negativeMarks || 0;
        }

        return {
          questionIndex: index,
          questionText: question.question,
          questionType: question.questionType || "mcq",
          options: question.options || [],
          userAnswer: userAnswer !== undefined && userAnswer !== null ? userAnswer : null,
          correctAnswer: question.correctAnswer,
          isCorrect,
          marks: marks,
        };
      });

      const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0;

      const submissionData = {
        testId,
        testName: testData.testName,
        studentId: studentData.id,
        studentName: studentData.name,
        answers: detailedAnswers,
        responses: detailedAnswers,
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

                <div className="review-question-text">
                  <ContentRenderer content={answer.questionText} />
                </div>

                {answer.questionType === "text" ? (
                  <div className="review-text-answer">
                    <div className="text-answer-box">
                      <strong>Your Answer:</strong>
                      <span className={answer.isCorrect ? "correct-text" : "incorrect-text"}>
                        {answer.userAnswer || "Not Answered"}
                      </span>
                    </div>
                    {!answer.isCorrect && (
                      <div className="text-answer-box correct-answer-box">
                        <strong>Correct Answer:</strong>
                        <span className="correct-text">{answer.correctAnswer}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="review-options">
                    {answer.options && answer.options.map((option, optIndex) => {
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
                          <ContentRenderer content={option} />
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
                )}
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
                } ${answers[index] !== undefined && answers[index] !== null && answers[index] !== "" ? "answered" : ""}`}
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

              <div className="question-text">
                <ContentRenderer content={currentQuestion.question} />
              </div>

              {currentQuestion.questionType === "text" ? (
                <div className="text-input-container">
                  <div className="input-label">
                    <Edit3 size={18} />
                    <span>Enter your answer:</span>
                  </div>
                  <input
                    type="text"
                    className="text-answer-input"
                    placeholder="Type your answer here..."
                    value={answers[currentQuestionIndex] || ""}
                    onChange={(e) => handleTextAnswerChange(currentQuestionIndex, e.target.value)}
                  />
                </div>
              ) : (
                <div className="options-container">
                  {currentQuestion.options && currentQuestion.options.map((option, index) => (
                    <div
                      key={index}
                      className={`option-item ${
                        answers[currentQuestionIndex] === index ? "selected" : ""
                      }`}
                      onClick={() => handleAnswerSelect(currentQuestionIndex, index)}
                    >
                      <div className="option-radio"></div>
                      <div className="option-content">
                        <ContentRenderer content={option} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

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