import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { app } from "../firebase";
import "../styles/Login.css";

// Import your school logo
import schoolLogo from "../assets/pupil.jpg";

const db = getFirestore(app);

function Login() {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const navigate = useNavigate();

  const ecoQuotes = [
    "Growing Together, Learning Forever",
    "Nurturing Young Minds with Nature",
    "Education with Environmental Consciousness",
    "Building a Sustainable Future, One Student at a Time",
    "Where Learning Meets Sustainability"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % ecoQuotes.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      // ✅ FIRST: Check credentials in USERS collection (for teachers/admin)
      const usersQuery = query(
        collection(db, "users"),
        where("id", "==", id),
        where("password", "==", password)
      );

      const usersSnapshot = await getDocs(usersQuery);

      // If user found in users collection
      if (!usersSnapshot.empty) {
        const user = usersSnapshot.docs[0].data();
        console.log("Login success (user):", user);

        // ✅ Store login ID (Tech001 / Tech002)
        localStorage.setItem("teacherId", user.id);

        // ✅ Store REAL Firestore teacher document ID
        if (user.role === "teacher") {
          localStorage.setItem("teacherDocId", user.teacherId);
          console.log("Stored teacherDocId =", user.teacherId);
        }

        // ✅ Redirect based on role
        if (user.role === "admin") {
          navigate("/admin");
        } else if (user.role === "teacher") {
          navigate("/teacher");
        } else if (user.role === "student") {
          navigate("/student/dashboard");
        }
        
        setLoading(false);
        return;
      }

      // ✅ SECOND: If not found in users, check STUDENTS collection
      console.log("Not found in users, checking students with rollNumber:", id);
      
      // Check if password is "welcome" for students
      if (password !== "welcome") {
        setError("Invalid ID or password.");
        setLoading(false);
        return;
      }

      // Query students by rollNumber
      const studentsQuery = query(
        collection(db, "students"),
        where("rollNumber", "==", id)
      );
      
      const studentsSnapshot = await getDocs(studentsQuery);
      console.log("Students query result:", studentsSnapshot.empty ? "empty" : "found");

      if (studentsSnapshot.empty) {
        setError("Invalid ID or password.");
        setLoading(false);
        return;
      }

      // Get student data
      const studentDoc = studentsSnapshot.docs[0];
      const studentData = { id: studentDoc.id, ...studentDoc.data() };
      console.log("Login success (student):", studentData);

      // Store student data in sessionStorage
      sessionStorage.setItem("studentData", JSON.stringify(studentData));

      // Navigate to student dashboard
      navigate("/student-dashboard");
      
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Please try again!");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && id && password && !loading) {
      handleLogin();
    }
  };

  return (
    <div className="login-page-container">
      {/* Floating leaves animation */}
      <div className="login-leaves-container">
        {[...Array(8)].map((_, i) => (
          <div key={i} className={`login-leaf login-leaf-${i + 1}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z"/>
            </svg>
          </div>
        ))}
      </div>

      {/* Logo and School Name Section */}
      <div className="login-header-section">
        <div className="login-logo-container">
          <div className="login-logo-wrapper">
            <img src={schoolLogo} alt="The Pupil Logo" className="login-school-logo" />
          </div>
          <h1 className="login-school-name">THE PUPIL</h1>
        </div>
        <p className="login-school-subtitle">Saveetha Eco School - Where Learning Meets Sustainability</p>

        {/* Animated Quote */}
        <div className="login-quote-container">
          <div className="login-quote-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17,10C15.89,10 15,10.89 15,12A2,2 0 0,0 17,14C18.11,14 19,13.11 19,12C19,10.89 18.11,10 17,10M7,10C5.89,10 5,10.89 5,12A2,2 0 0,0 7,14C8.11,14 9,13.11 9,12C9,10.89 8.11,10 7,10M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12C4,14.4 5,16.5 6.6,18C8.3,16.7 10.1,16 12,16C13.9,16 15.7,16.7 17.4,18C19,16.5 20,14.4 20,12A8,8 0 0,0 12,4Z"/>
            </svg>
          </div>
          <p className="login-quote" key={quoteIndex}>
            {ecoQuotes[quoteIndex]}
          </p>
        </div>
      </div>

      {/* Login Card */}
      <div className="login-card">
        <div className="login-card-header">
          <div className="login-icon-circle">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
            </svg>
          </div>
          <h2 className="login-card-title">Welcome Back</h2>
          <p className="login-card-subtitle">Sign in to continue your journey</p>
        </div>

        <div className="login-form-container">
          <div className="login-input-group">
            <label className="login-input-label">User ID / Roll Number</label>
            <div className="login-input-wrapper">
              <span className="login-input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
                </svg>
              </span>
              <input
                type="text"
                placeholder="Enter your ID or roll number"
                value={id}
                onChange={(e) => setId(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                className="login-input-field"
              />
            </div>
          </div>

          <div className="login-input-group">
            <label className="login-input-label">Password</label>
            <div className="login-input-wrapper">
              <span className="login-input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"/>
                </svg>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                className="login-input-field"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="login-toggle-password"
                disabled={loading}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.83,9L15,12.16C15,12.11 15,12.05 15,12A3,3 0 0,0 12,9C11.94,9 11.89,9 11.83,9M7.53,9.8L9.08,11.35C9.03,11.56 9,11.77 9,12A3,3 0 0,0 12,15C12.22,15 12.44,14.97 12.65,14.92L14.2,16.47C13.53,16.8 12.79,17 12,17A5,5 0 0,1 7,12C7,11.21 7.2,10.47 7.53,9.8M2,4.27L4.28,6.55L4.73,7C3.08,8.3 1.78,10 1,12C2.73,16.39 7,19.5 12,19.5C13.55,19.5 15.03,19.2 16.38,18.66L16.81,19.08L19.73,22L21,20.73L3.27,3M12,7A5,5 0 0,1 17,12C17,12.64 16.87,13.26 16.64,13.82L19.57,16.75C21.07,15.5 22.27,13.86 23,12C21.27,7.61 17,4.5 12,4.5C10.6,4.5 9.26,4.75 8,5.2L10.17,7.35C10.74,7.13 11.35,7 12,7Z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="login-error-message">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading || !id || !password}
            className={`login-submit-button ${loading || !id || !password ? "disabled" : ""}`}
          >
            {loading ? (
              <>
                <div className="login-spinner"></div>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <svg className="login-arrow" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4,11V13H16L10.5,18.5L11.92,19.92L19.84,12L11.92,4.08L10.5,5.5L16,11H4Z"/>
                </svg>
              </>
            )}
          </button>
        </div>

        <div className="login-card-footer">
          <p className="login-footer-text">Need help? Contact your administrator</p>
        </div>
      </div>

      {/* Bottom Eco Message */}
      <div className="login-bottom-message">
        <span className="login-eco-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.9,17.39C17.64,16.59 16.89,16 16,16H15V13A1,1 0 0,0 14,12H8V10H10A1,1 0 0,0 11,9V7H13A2,2 0 0,0 15,5V4.59C17.93,5.77 20,8.64 20,12C20,14.08 19.2,15.97 17.9,17.39M11,19.93C7.05,19.44 4,16.08 4,12C4,11.38 4.08,10.78 4.21,10.21L9,15V16A2,2 0 0,0 11,18M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
          </svg>
        </span>
        <span className="login-eco-text">Committed to Sustainable Education</span>
      </div>
    </div>
  );
}

export default Login;