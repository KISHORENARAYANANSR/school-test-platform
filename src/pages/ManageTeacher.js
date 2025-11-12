// src/pages/ManageTeacher.js
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../pages/components/Sidebar";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import "../styles/ManageTeacher.css";
import * as XLSX from "xlsx";

function ManageTeacher() {
  const [teachers, setTeachers] = useState([]);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "teachers"));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTeachers(data);
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this teacher?")) {
      try {
        await deleteDoc(doc(db, "teachers", id));
        alert("Teacher deleted successfully!");
        fetchTeachers();
      } catch (error) {
        console.error("Error deleting teacher:", error);
        alert("Error deleting teacher.");
      }
    }
  };

  const exportToExcel = () => {
    const exportData = filteredTeachers.map((t) => ({
      Name: t.name || "—",
      Department: t.department || "—",
      Email: t.email || "—",
      Subject: t.subject || "—",
      Status: t.status || "Inactive",
      Classes: t.classes || "—",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Teachers");
    XLSX.writeFile(wb, "Teachers_Data.xlsx");
  };

  const filteredTeachers = teachers.filter((t) => {
    const matchesName = t.name?.toLowerCase().includes(search.toLowerCase()) ||
                       t.email?.toLowerCase().includes(search.toLowerCase());
    const matchesDept = filterDept
      ? t.department?.toLowerCase() === filterDept.toLowerCase()
      : true;
    return matchesName && matchesDept;
  });

  const departments = [...new Set(teachers.map((t) => t.department).filter(Boolean))];

  return (
    <div className="manage-container">
      <Sidebar />
      <div className="manage-main">
        <div className="manage-header">
          <div className="header-content">
            <h2>Manage Teachers</h2>
            <p className="header-subtitle">View and manage all teacher records</p>
          </div>
          <div className="teacher-count-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            <span>{teachers.length} Total Teachers</span>
          </div>
        </div>

        <div className="manage-controls">
          <div className="search-filter-group">
            <div className="search-box">
              <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="filter-box">
              <svg className="filter-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="filter-select"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="action-buttons">
            <Link to="/add-teacher" className="add-teacher-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <line x1="20" y1="8" x2="20" y2="14"></line>
                <line x1="23" y1="11" x2="17" y2="11"></line>
              </svg>
              Add New Teacher
            </Link>
            <button onClick={exportToExcel} className="export-excel-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Export to Excel
            </button>
          </div>
        </div>

        <div className="table-container">
          <div className="table-header-info">
            <h3>Teacher Directory</h3>
            <span className="result-count">{filteredTeachers.length} results</span>
          </div>
          <table className="teachers-table">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Full Name</th>
                <th>Department</th>
                <th>Subject</th>
                <th>Classes Taught</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.length > 0 ? (
                filteredTeachers.map((teacher) => (
                  <tr key={teacher.id}>
                    <td>
                      <div className="teacher-avatar">
                        <img
                          src={teacher.photoURL || `https://ui-avatars.com/api/?name=${teacher.name || "User"}&background=f97316&color=fff`}
                          alt="Profile"
                          className="teacher-photo"
                        />
                      </div>
                    </td>
                    <td>
                      <div className="teacher-info">
                        <div className="teacher-name">{teacher.name || "—"}</div>
                        <div className="teacher-email">{teacher.email || "—"}</div>
                      </div>
                    </td>
                    <td>
                      <div className="dept-badge">{teacher.department || "—"}</div>
                    </td>
                    <td>
                      <span className="subject-text">{teacher.subject || "—"}</span>
                    </td>
                    <td>
                      <span className="classes-taught">{teacher.classes || "—"}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${teacher.status?.toLowerCase() === "active" ? "active" : "inactive"}`}>
                        <span className="status-dot"></span>
                        {teacher.status || "Active"}
                      </span>
                    </td>
                    <td>
                      <div className="action-icons">
                        <button className="icon-btn view-btn" title="View Details">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        </button>
                        <button className="icon-btn edit-btn" title="Edit Teacher">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button className="icon-btn delete-btn" onClick={() => handleDelete(teacher.id)} title="Delete">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="no-data">
                    <div className="empty-state-inline">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                      <p>No teachers found matching your criteria</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ManageTeacher;