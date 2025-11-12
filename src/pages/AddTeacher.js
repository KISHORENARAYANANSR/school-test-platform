import React, { useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../pages/components/Sidebar";
import "../styles/AddUser.css";
import * as XLSX from "xlsx";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

const AddTeacher = () => {
  const [teacher, setTeacher] = useState({
    name: "",
    email: "",
    subject: "",
    department: "",
  });
  const [file, setFile] = useState(null);

  const handleInputChange = (e) => {
    setTeacher({ ...teacher, [e.target.name]: e.target.value });
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!teacher.name || !teacher.email) return alert("Fill all details");
    try {
      await addDoc(collection(db, "teachers"), teacher);
      alert("Teacher added successfully!");
      setTeacher({ name: "", email: "", subject: "", department: "" });
    } catch (err) {
      console.error(err);
      alert("Error adding teacher.");
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
      for (let t of jsonData) {
        await addDoc(collection(db, "teachers"), t);
      }
      alert("Teachers imported successfully!");
      setFile(null);
    } catch (err) {
      console.error(err);
      alert("Error importing teachers");
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { name: "John Doe", email: "john@example.com", subject: "Maths", department: "Science" },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Teacher_Template.xlsx");
  };

  return (
    <div className="adduser-container">
      <Sidebar />
      <div className="adduser-main">
        <div className="page-header-section">
          <Link to="/admin" className="back-to-dashboard">
            Back to Dashboard
          </Link>
          <h2 className="page-title">Add New Teacher</h2>
          <p className="page-subtitle">Onboard teachers manually or bulk upload via Excel</p>
        </div>

        <div className="adduser-grid">
          {/* Manual Form */}
          <div className="adduser-card manual-card">
            <div className="card-icon-header">
              <div className="icon-circle orange">
                <span></span>
              </div>
              <div>
                <h3>Add Teacher Manually</h3>
                <p className="card-description">Enter teacher details individually</p>
              </div>
            </div>
            
            <form onSubmit={handleManualSubmit} className="adduser-form">
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  name="name" 
                  placeholder="Enter teacher name" 
                  value={teacher.name} 
                  onChange={handleInputChange} 
                />
              </div>
              
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  name="email" 
                  placeholder="teacher@example.com" 
                  value={teacher.email} 
                  onChange={handleInputChange} 
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Subject</label>
                  <input 
                    type="text" 
                    name="subject" 
                    placeholder="e.g., Mathematics" 
                    value={teacher.subject} 
                    onChange={handleInputChange} 
                  />
                </div>
                
                <div className="form-group">
                  <label>Department</label>
                  <input 
                    type="text" 
                    name="department" 
                    placeholder="e.g., Science" 
                    value={teacher.department} 
                    onChange={handleInputChange} 
                  />
                </div>
              </div>
              
              <button type="submit" className="submit-btn orange-btn">
                <span>✓</span> Add Teacher
              </button>
            </form>
          </div>

          {/* Excel Import */}
          <div className="adduser-card import-card">
            <div className="card-icon-header">
              <div className="icon-circle green">
                <span></span>
              </div>
              <div>
                <h3>Bulk Import via Excel</h3>
                <p className="card-description">Upload multiple teachers at once</p>
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
              <button className="import-btn green-btn" onClick={handleImport}>
                <span>⬆</span> Upload & Import
              </button>
            </div>

            <div className="info-box">
              <span className="info-icon">ℹ️</span>
              <p>Download the template, fill in teacher details, and upload the completed file.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddTeacher;