import React, { useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../pages/components/Sidebar";
import "../styles/AddUser.css";
import * as XLSX from "xlsx";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

const AddStudent = () => {
  const [student, setStudent] = useState({
    name: "",
    email: "",
    grade: "",
    rollNumber: "",
  });
  const [file, setFile] = useState(null);

  const handleInputChange = (e) => {
    setStudent({ ...student, [e.target.name]: e.target.value });
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!student.name || !student.email) return alert("Fill all details");
    try {
      await addDoc(collection(db, "students"), student);
      alert("Student added successfully!");
      setStudent({ name: "", email: "", grade: "", rollNumber: "" });
    } catch (err) {
      console.error(err);
      alert("Error adding student.");
    }
  };

  const handleExcelUpload = (e) => {
    const selected = e.target.files[0];
    setFile(selected);
  };

  const handleImport = async () => {
    if (!file) return alert("Please select an Excel file first");
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    try {
      for (let s of jsonData) {
        await addDoc(collection(db, "students"), s);
      }
      alert("Students imported successfully!");
      setFile(null);
    } catch (err) {
      console.error(err);
      alert("Error importing students");
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { name: "Jane Doe", email: "jane@example.com", grade: "10", rollNumber: "A101" },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Student_Template.xlsx");
  };

  return (
    <div className="adduser-container">
      <Sidebar />
      <div className="adduser-main">
        <div className="page-header-section">
          <Link to="/admin" className="back-to-dashboard">
            Back to Dashboard
          </Link>
          <h2 className="page-title">Add New Student</h2>
          <p className="page-subtitle">Register students manually or bulk upload via Excel</p><br></br>
        </div>

        <div className="adduser-grid">
          {/* Manual Form */}
          <div className="adduser-card manual-card">
            <div className="card-icon-header">
              <div className="icon-circle green">
                <span></span>
              </div>
              <div>
                <h3>Add Student Manually</h3>
                <p className="card-description">Enter student details individually</p>
              </div>
            </div>
            
            <form onSubmit={handleManualSubmit} className="adduser-form">
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  name="name" 
                  placeholder="Enter student name" 
                  value={student.name} 
                  onChange={handleInputChange} 
                />
              </div>
              
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  name="email" 
                  placeholder="student@example.com" 
                  value={student.email} 
                  onChange={handleInputChange} 
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Grade</label>
                  <input 
                    type="text" 
                    name="grade" 
                    placeholder="e.g., 10" 
                    value={student.grade} 
                    onChange={handleInputChange} 
                  />
                </div>
                
                <div className="form-group">
                  <label>Roll Number</label>
                  <input 
                    type="text" 
                    name="rollNumber" 
                    placeholder="e.g., A101" 
                    value={student.rollNumber} 
                    onChange={handleInputChange} 
                  />
                </div>
              </div>
              
              <button type="submit" className="submit-btn green-btn">
                <span>✓</span> Add Student
              </button>
            </form>
          </div>

          {/* Excel Import */}
          <div className="adduser-card import-card">
            <div className="card-icon-header">
              <div className="icon-circle orange">
                <span></span>
              </div>
              <div>
                <h3>Bulk Import via Excel</h3>
                <p className="card-description">Upload multiple students at once</p>
              </div>
            </div>

            <div className="upload-section">
              <div className="file-upload-box">
                <input 
                  id="fileInput" 
                  type="file" 
                  accept=".xlsx, .xls" 
                  onChange={handleExcelUpload}
                  style={{ display: 'none' }}
                />
                <label htmlFor="fileInput" className="file-upload-label">
                  <div className="upload-icon">📄</div>
                  <div className="upload-text">
                    <span className="upload-main">Click to browse</span>
                    <span className="upload-sub">or drag and drop Excel file</span>
                  </div>
                </label>
              </div>
              
              {file && (
                <div className="file-selected-box">
                  <span className="file-icon">📎</span>
                  <span className="file-name">{file.name}</span>
                  <button 
                    className="remove-file-btn" 
                    onClick={() => setFile(null)}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <div className="action-buttons-group">
              <button className="template-btn" onClick={downloadTemplate}>
                <span>⬇</span> Download Template
              </button>
              <button className="import-btn orange-btn" onClick={handleImport}>
                <span>⬆</span> Upload & Import
              </button>
            </div>

            <div className="info-box">
              <span className="info-icon">ℹ️</span>
              <p>Download the template, fill in student details, and upload the completed file.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddStudent;