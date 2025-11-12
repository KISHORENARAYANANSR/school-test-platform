import React, { useEffect, useState } from "react";
import Sidebar from "../pages/components/Sidebar";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { 
  Search, 
  Users, 
  UserPlus, 
  MapPin, 
  BookOpen, 
  ArrowLeft, 
  Edit2, 
  Trash2, 
  Check,
  GraduationCap,
  UserCheck
} from "lucide-react";
import "../styles/ManageStudents.css";

function ManageStudents() {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    rollNumber: "",
    status: "Active",
  });
  const [editingStudent, setEditingStudent] = useState(null);

  // Fetch all classes and students
  useEffect(() => {
    fetchClasses();
    fetchStudents();
  }, []);

  const fetchClasses = async () => {
    try {
      const snap = await getDocs(collection(db, "classes"));
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setClasses(data);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const fetchStudents = async () => {
    try {
      const snap = await getDocs(collection(db, "students"));
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setStudents(data);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  // Get students for selected class
  const getClassStudents = () => {
    if (!selectedClass) return [];
    
    const studentIds = selectedClass.students || [];
    return students.filter(student => studentIds.includes(student.id));
  };

  const handleAddStudent = async () => {
    if (!selectedClass) return;
    if (!newStudent.name.trim() || !newStudent.email.trim() || !newStudent.rollNumber.trim()) {
      return alert("Please fill all student details");
    }

    try {
      // Create new student object
      const studentData = {
        id: Date.now().toString(),
        ...newStudent,
        createdAt: new Date().toISOString(),
      };

      // Add to students collection
      await updateDoc(doc(db, "students", studentData.id), studentData);

      // Update class with new student ID
      const updatedStudentIds = [...(selectedClass.students || []), studentData.id];
      await updateDoc(doc(db, "classes", selectedClass.id), {
        students: updatedStudentIds,
        updatedAt: new Date().toISOString(),
      });

      // Refresh data
      await fetchStudents();
      await fetchClasses();
      
      // Update selected class
      const updatedClass = classes.find(c => c.id === selectedClass.id);
      setSelectedClass({ ...updatedClass, students: updatedStudentIds });

      setNewStudent({ name: "", email: "", rollNumber: "", status: "Active" });
      alert("Student added successfully ✅");
    } catch (error) {
      console.error("Error adding student:", error);
      alert("Error adding student");
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!window.confirm("Are you sure you want to remove this student from the class?")) {
      return;
    }

    try {
      const updatedStudentIds = selectedClass.students.filter(id => id !== studentId);
      
      await updateDoc(doc(db, "classes", selectedClass.id), {
        students: updatedStudentIds,
        updatedAt: new Date().toISOString(),
      });

      await fetchClasses();
      const updatedClass = classes.find(c => c.id === selectedClass.id);
      setSelectedClass({ ...updatedClass, students: updatedStudentIds });
      
      alert("Student removed from class successfully");
    } catch (error) {
      console.error("Error removing student:", error);
      alert("Error removing student");
    }
  };

  const handleToggleStatus = async (student) => {
    const newStatus = student.status === "Active" ? "Inactive" : "Active";
    
    try {
      await updateDoc(doc(db, "students", student.id), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      
      await fetchStudents();
      alert(`Student status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Error updating status");
    }
  };

  const filteredClasses = classes.filter(cls =>
    cls.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const classStudents = getClassStudents();

  return (
    <div className="students-container">
      <Sidebar />
      <div className="students-main">
        {!selectedClass ? (
          <>
            <div className="page-header">
              <div>
                <h2>Manage Students</h2>
                <p className="subtitle">Select a class to view and manage students</p>
              </div>
            </div>

            <div className="search-bar">
              <div className="search-input-wrapper">
                <Search className="search-icon" size={20} />
                <input
                  type="text"
                  placeholder="Search by class name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>

            <div className="class-card-grid">
              {filteredClasses.length > 0 ? (
                filteredClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="class-card-item"
                    onClick={() => setSelectedClass(cls)}
                  >
                    <div className="class-card-header">
                      <h3>{cls.name}</h3>
                      <span className="class-badge">Grade {cls.grade}</span>
                    </div>
                    <div className="class-card-body">
                      <div className="class-stat">
                        <div className="stat-icon-circle green">
                          <Users size={22} />
                        </div>
                        <div>
                          <div className="stat-value">{(cls.students || []).length}</div>
                          <div className="stat-label">Students</div>
                        </div>
                      </div>
                      <div className="class-stat">
                        <div className="stat-icon-circle orange">
                          <UserCheck size={22} />
                        </div>
                        <div>
                          <div className="stat-value">{(cls.mappings || []).length}</div>
                          <div className="stat-label">Teachers</div>
                        </div>
                      </div>
                    </div>
                    <div className="class-card-footer">
                      <span className="section-info">
                        <MapPin size={16} className="inline-icon" />
                        Section: {cls.section || "N/A"}
                      </span>
                      <span className="view-link">View Details →</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">
                    <BookOpen size={80} strokeWidth={1.5} />
                  </div>
                  <h3>No Classes Found</h3>
                  <p>Create classes in the Mapping section to get started</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="student-list-section">
            <div className="section-header">
              <button className="back-btn" onClick={() => setSelectedClass(null)}>
                <ArrowLeft size={18} />
                Back to Classes
              </button>
              <div className="class-info-header">
                <h3>{selectedClass.name}</h3>
                <span className="class-details">
                  Grade {selectedClass.grade} {selectedClass.section && `• Section ${selectedClass.section}`}
                </span>
              </div>
            </div>

            <div className="add-student-card">
              <div className="card-header-with-icon">
                <div className="icon-badge green">
                  <UserPlus size={20} />
                </div>
                <h4>Add New Student to Class</h4>
              </div>
              <div className="add-student-form">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={newStudent.name}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, name: e.target.value })
                  }
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={newStudent.email}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, email: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Roll Number"
                  value={newStudent.rollNumber}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, rollNumber: e.target.value })
                  }
                />
                <button className="add-student-btn" onClick={handleAddStudent}>
                  <Check size={18} />
                  Add Student
                </button>
              </div>
            </div>

            {classStudents.length > 0 ? (
              <div className="students-table-container">
                <div className="table-header">
                  <h4>
                    <GraduationCap size={20} className="inline-icon" />
                    Student List
                  </h4>
                  <span className="student-count">{classStudents.length} students</span>
                </div>
                <table className="students-table">
                  <thead>
                    <tr>
                      <th>Photo</th>
                      <th>Full Name</th>
                      <th>Roll No</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classStudents.map((student) => (
                      <tr key={student.id}>
                        <td>
                          <div className="student-avatar">
                            <img
                              src={student.photoURL || `https://ui-avatars.com/api/?name=${student.name}&background=10b981&color=fff`}
                              alt={student.name}
                            />
                          </div>
                        </td>
                        <td>
                          <div className="student-name-cell">
                            <div className="name-primary">{student.name}</div>
                            <div className="name-secondary">{student.department || "Student"}</div>
                          </div>
                        </td>
                        <td><span className="roll-badge">{student.rollNumber}</span></td>
                        <td>{student.email}</td>
                        <td>
                          <span
                            className={`status-badge ${
                              student.status === "Active"
                                ? "status-active"
                                : "status-inactive"
                            }`}
                            onClick={() => handleToggleStatus(student)}
                            style={{ cursor: "pointer" }}
                          >
                            {student.status}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="action-btn edit-btn"
                              title="Edit Student"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              className="action-btn delete-btn"
                              title="Remove from Class"
                              onClick={() => handleRemoveStudent(student.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  <GraduationCap size={80} strokeWidth={1.5} />
                </div>
                <h3>No Students Yet</h3>
                <p>Add students to this class using the form above</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageStudents;