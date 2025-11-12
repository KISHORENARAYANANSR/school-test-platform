import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, doc, getDoc, addDoc, serverTimestamp } from "firebase/firestore";
import * as XLSX from "xlsx";
import { ArrowLeft, FileText, CheckCircle, XCircle, Upload, Users } from "lucide-react";
import "../styles/ClassDetails.css";

const ClassDetails = () => {
  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  
  // Test creation states
  const [testName, setTestName] = useState("");
  const [testDuration, setTestDuration] = useState(30);
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [negativeMarks, setNegativeMarks] = useState(0.25);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [excelFile, setExcelFile] = useState(null);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    const fetchClassData = async () => {
      try {
        const classId = window.location.pathname.split("/").pop();
        const classRef = doc(db, "classes", classId);
        const classSnap = await getDoc(classRef);

        if (classSnap.exists()) {
          const data = classSnap.data();
          setClassData({ id: classSnap.id, ...data });

          // Fetch student details
          if (data.students && data.students.length > 0) {
            const studentPromises = data.students.map(async (studentId) => {
              const studentRef = doc(db, "students", studentId);
              const studentSnap = await getDoc(studentRef);
              return studentSnap.exists()
                ? { id: studentSnap.id, ...studentSnap.data() }
                : null;
            });
            const studentList = await Promise.all(studentPromises);
            setStudents(studentList.filter((s) => s !== null));
          }
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching class data:", err);
        setLoading(false);
      }
    };

    fetchClassData();
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    setExcelFile(file);
    setUploadError("");

    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          // Validate and parse questions
          const parsedQuestions = jsonData.map((row, index) => {
            // Check for required fields
            if (!row.question || !row.option1 || !row.option2 || !row.answer) {
              throw new Error(`Row ${index + 2}: Missing required fields (question, option1, option2, or answer)`);
            }

            // Collect all options
            const options = [
              row.option1,
              row.option2,
              row.option3 || "",
              row.option4 || "",
            ].filter(opt => opt !== "");

            // Normalize the correct answer - convert to option index (0, 1, 2, 3)
            const answerString = String(row.answer).trim().toLowerCase();
            let correctAnswerIndex;

            // Check if answer is "option1", "option2", etc.
            if (answerString.startsWith('option')) {
              const optionNum = parseInt(answerString.replace('option', ''));
              correctAnswerIndex = optionNum - 1; // Convert to 0-based index
            } 
            // Check if answer is "a", "b", "c", "d"
            else if (['a', 'b', 'c', 'd'].includes(answerString)) {
              correctAnswerIndex = answerString.charCodeAt(0) - 97; // 'a' = 0, 'b' = 1, etc.
            }
            // Check if answer is a number (1, 2, 3, 4)
            else if (!isNaN(answerString) && parseInt(answerString) >= 1 && parseInt(answerString) <= 4) {
              correctAnswerIndex = parseInt(answerString) - 1;
            }
            // Try to match the answer text with one of the options
            else {
              correctAnswerIndex = options.findIndex(
                opt => String(opt).trim().toLowerCase() === answerString
              );
              
              if (correctAnswerIndex === -1) {
                throw new Error(
                  `Row ${index + 2}: Answer "${row.answer}" doesn't match any option. ` +
                  `Use format: "option1", "a", "1", or exact option text.`
                );
              }
            }

            // Validate that the index is within bounds
            if (correctAnswerIndex < 0 || correctAnswerIndex >= options.length) {
              throw new Error(
                `Row ${index + 2}: Invalid answer index. Expected 0-${options.length - 1}, got ${correctAnswerIndex}`
              );
            }

            return {
              question: String(row.question).trim(),
              questionText: String(row.question).trim(),
              options: options,
              correctAnswer: correctAnswerIndex, // Store as NUMBER index
              marks: row.marks ? Number(row.marks) : 1,
            };
          });

          if (parsedQuestions.length === 0) {
            throw new Error("No valid questions found in the Excel file");
          }

          setQuestions(parsedQuestions);
          setUploadError("");
          console.log("Parsed questions:", parsedQuestions); // Debug log
        } catch (error) {
          setUploadError(`Error parsing file: ${error.message}`);
          setQuestions([]);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleStudentSelect = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map((s) => s.id));
    }
  };

  const handleCreateTest = async () => {
    if (!testName.trim()) {
      alert("Please enter a test name");
      return;
    }
    if (questions.length === 0) {
      alert("Please upload questions");
      return;
    }
    if (selectedStudents.length === 0) {
      alert("Please select at least one student");
      return;
    }

    try {
      // Calculate total marks
      const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 1), 0);

      const testData = {
        testName: testName.trim(),
        classId: classData.id,
        className: classData.name,
        section: classData.section,
        grade: classData.grade,
        duration: testDuration,
        negativeMarking,
        negativeMarks: negativeMarking ? negativeMarks : 0,
        questions: questions,
        selectedStudents: selectedStudents,
        totalMarks: totalMarks,
        totalQuestions: questions.length,
        createdAt: serverTimestamp(),
        status: "active",
      };

      console.log("Creating test with data:", testData); // Debug log
      await addDoc(collection(db, "tests"), testData);
      
      alert("Test created successfully!");
      setShowPopup(false);
      resetForm();
    } catch (error) {
      console.error("Error creating test:", error);
      alert("Failed to create test. Please try again.");
    }
  };

  const resetForm = () => {
    setTestName("");
    setTestDuration(30);
    setNegativeMarking(false);
    setNegativeMarks(0.25);
    setSelectedStudents([]);
    setQuestions([]);
    setExcelFile(null);
    setUploadError("");
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!classData) return <div className="error">Class not found</div>;

  return (
    <div className="class-details-container">
      <div className="class-header">
        <button className="back-btn" onClick={() => window.history.back()}>
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>
        <h1>{classData.name} - {classData.section}</h1>
        <div className="class-info">
          <span className="info-badge">
            <span className="info-label">Grade:</span> {classData.grade}
          </span>
          <span className="info-badge">
            <span className="info-label">Subject:</span> {classData.mappings?.[0]?.subject || "N/A"}
          </span>
          <span className="info-badge">
            <span className="info-label">Total Students:</span> {students.length}
          </span>
        </div>
      </div>

      <div className="students-section">
        <div className="section-header">
          <div className="header-left">
            <Users size={24} className="header-icon" />
            <h2>Students List</h2>
          </div>
          <button className="conduct-test-btn" onClick={() => setShowPopup(true)}>
            <FileText size={20} />
            <span>Conduct Test</span>
          </button>
        </div>

        <div className="students-table-container">
          {students.length === 0 ? (
            <p className="no-data">No students enrolled in this class</p>
          ) : (
            <table className="students-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Roll Number</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr key={student.id}>
                    <td>{index + 1}</td>
                    <td>{student.studentId}</td>
                    <td>{student.name}</td>
                    <td>{student.email || "N/A"}</td>
                    <td>{student.rollNumber || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showPopup && (
        <div className="popup-overlay" onClick={() => setShowPopup(false)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <div className="header-title">
                <FileText size={28} />
                <h2>Create New Test</h2>
              </div>
              <button className="close-btn" onClick={() => setShowPopup(false)}>
                ×
              </button>
            </div>

            <div className="popup-body">
              <div className="form-group">
                <label>Test Name *</label>
                <input
                  type="text"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="e.g., Unit Test 1"
                  className="form-input"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Duration (minutes) *</label>
                  <input
                    type="number"
                    value={testDuration}
                    onChange={(e) => setTestDuration(Number(e.target.value))}
                    min="1"
                    className="form-input"
                  />
                </div>

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={negativeMarking}
                      onChange={(e) => setNegativeMarking(e.target.checked)}
                    />
                    <span>Enable Negative Marking</span>
                  </label>
                </div>
              </div>

              {negativeMarking && (
                <div className="form-group">
                  <label>Negative Marks (per wrong answer)</label>
                  <input
                    type="number"
                    value={negativeMarks}
                    onChange={(e) => setNegativeMarks(Number(e.target.value))}
                    step="0.25"
                    min="0"
                    className="form-input"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Upload Questions (Excel) *</label>
                <div className="file-upload-area">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="file-upload-label">
                    <Upload size={20} />
                    <span>{excelFile ? excelFile.name : "Choose Excel file"}</span>
                  </label>
                </div>
                <small className="helper-text">
                  Format: question, option1, option2, option3, option4, answer (use "option1"/"a"/"1" or exact text), marks
                </small>
                {uploadError && (
                  <p className="error-text">
                    <XCircle size={16} />
                    <span>{uploadError}</span>
                  </p>
                )}
                {questions.length > 0 && (
                  <p className="success-text">
                    <CheckCircle size={16} />
                    <span>{questions.length} questions loaded successfully</span>
                  </p>
                )}
              </div>

              <div className="form-group">
                <div className="students-header">
                  <label>Select Students *</label>
                  <button
                    type="button"
                    className="select-all-btn"
                    onClick={handleSelectAll}
                  >
                    {selectedStudents.length === students.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>
                <div className="students-list">
                  {students.map((student) => (
                    <label key={student.id} className="student-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleStudentSelect(student.id)}
                      />
                      <span>{student.name} ({student.rollNumber || student.studentId})</span>
                    </label>
                  ))}
                </div>
                <small className="helper-text">
                  {selectedStudents.length} of {students.length} students selected
                </small>
              </div>
            </div>

            <div className="popup-footer">
              <button className="cancel-btn" onClick={() => setShowPopup(false)}>
                Cancel
              </button>
              <button className="create-btn" onClick={handleCreateTest}>
                <FileText size={18} />
                <span>Create Test</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassDetails;