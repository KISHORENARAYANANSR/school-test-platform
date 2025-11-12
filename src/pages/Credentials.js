// src/pages/Credentials.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../pages/components/Sidebar";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import {
  Shield,
  Users,
  GraduationCap,
  ArrowLeft,
  UserPlus,
  Edit2,
  Trash2,
  X,
  Info,
  Lock,
  Mail,
  User,
  Key,
  ChevronRight
} from "lucide-react";
import "../styles/Credentials.css";

function Credentials() {
  const [activeTab, setActiveTab] = useState("admins");
  const [admins, setAdmins] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  
  // Admin Form
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    id: "",
    password: "",
  });
  const [editingAdmin, setEditingAdmin] = useState(null);

  // Teacher Form
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherCredentials, setTeacherCredentials] = useState({
    id: "",
    password: "",
  });
  const [editingTeacher, setEditingTeacher] = useState(null);

  // Student Form
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [generatingStudents, setGeneratingStudents] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    await fetchAdmins();
    await fetchTeachers();
    await fetchStudents();
    await fetchClasses();
  };

  const fetchAdmins = async () => {
    try {
      const q = query(collection(db, "users"), where("role", "==", "admin"));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({
        docId: doc.id,
        ...doc.data(),
      }));
      setAdmins(data);
    } catch (error) {
      console.error("Error fetching admins:", error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "teachers"));
      const data = querySnapshot.docs.map((doc) => ({
        docId: doc.id,
        ...doc.data(),
      }));
      setTeachers(data);
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  const fetchStudents = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "students"));
      const data = querySnapshot.docs.map((doc) => ({
        docId: doc.id,
        ...doc.data(),
      }));
      setStudents(data);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const fetchClasses = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "classes"));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClasses(data);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  // Add New Admin
  const handleAddAdmin = async (e) => {
    e.preventDefault();

    if (!newAdmin.name || !newAdmin.email || !newAdmin.id || !newAdmin.password) {
      alert("Please fill all fields");
      return;
    }

    try {
      // Check if ID already exists (only when creating new, not editing)
      if (!editingAdmin) {
        const q = query(collection(db, "users"), where("id", "==", newAdmin.id));
        const existingUser = await getDocs(q);
        
        if (!existingUser.empty) {
          alert("User ID already exists!");
          return;
        }
      }

      if (editingAdmin) {
        // Update existing admin
        await updateDoc(doc(db, "users", editingAdmin.docId), {
          name: newAdmin.name,
          email: newAdmin.email,
          id: newAdmin.id,
          password: newAdmin.password,
          updatedAt: new Date().toISOString(),
        });
        alert("Admin updated successfully! ✅");
      } else {
        // Add new admin
        await addDoc(collection(db, "users"), {
          ...newAdmin,
          role: "admin",
          createdAt: new Date().toISOString(),
        });
        alert("Admin created successfully! ✅");
      }

      setNewAdmin({ name: "", email: "", id: "", password: "" });
      setEditingAdmin(null);
      setShowAdminModal(false);
      fetchAdmins();
    } catch (error) {
      console.error("Error saving admin:", error);
      alert("Error saving admin");
    }
  };

  // Open Edit Modal for Admin
  const handleEditAdmin = (admin) => {
    setEditingAdmin(admin);
    setNewAdmin({
      name: admin.name,
      email: admin.email,
      id: admin.id,
      password: admin.password,
    });
    setShowAdminModal(true);
  };

  // Generate/Edit Teacher Credentials
  const handleGenerateTeacherCredentials = async (e) => {
    e.preventDefault();

    if (!teacherCredentials.id || !teacherCredentials.password) {
      alert("Please fill all credential fields");
      return;
    }

    try {
      if (editingTeacher) {
        // Update existing teacher credentials
        const q = query(collection(db, "users"), where("teacherId", "==", editingTeacher.docId));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          await updateDoc(doc(db, "users", userDoc.id), {
            id: teacherCredentials.id,
            password: teacherCredentials.password,
            updatedAt: new Date().toISOString(),
          });

          // Update teacher with new userId
          await updateDoc(doc(db, "teachers", editingTeacher.docId), {
            userId: teacherCredentials.id,
            updatedAt: new Date().toISOString(),
          });

          alert("Teacher credentials updated successfully! ✅");
        }
      } else {
        // Create new credentials
        if (!selectedTeacher) {
          alert("Please select a teacher");
          return;
        }

        // Check if ID already exists
        const q = query(collection(db, "users"), where("id", "==", teacherCredentials.id));
        const existingUser = await getDocs(q);
        
        if (!existingUser.empty) {
          alert("User ID already exists!");
          return;
        }

        // Create user credential
        await addDoc(collection(db, "users"), {
          id: teacherCredentials.id,
          password: teacherCredentials.password,
          role: "teacher",
          teacherId: selectedTeacher.docId,
          name: selectedTeacher.name,
          email: selectedTeacher.email,
          createdAt: new Date().toISOString(),
        });

        // Update teacher with credentials info
        await updateDoc(doc(db, "teachers", selectedTeacher.docId), {
          hasCredentials: true,
          userId: teacherCredentials.id,
          updatedAt: new Date().toISOString(),
        });

        alert("Teacher credentials created successfully! ✅");
      }

      setTeacherCredentials({ id: "", password: "" });
      setSelectedTeacher(null);
      setEditingTeacher(null);
      setShowTeacherModal(false);
      fetchTeachers();
    } catch (error) {
      console.error("Error saving teacher credentials:", error);
      alert("Error saving credentials");
    }
  };

  // Open Edit Modal for Teacher
  const handleEditTeacher = async (teacher) => {
    try {
      // Get teacher's credentials from users collection
      const q = query(collection(db, "users"), where("teacherId", "==", teacher.docId));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        
        setEditingTeacher(teacher);
        setTeacherCredentials({
          id: userData.id,
          password: userData.password,
        });
        setShowTeacherModal(true);
      }
    } catch (error) {
      console.error("Error fetching teacher credentials:", error);
      alert("Error loading credentials for editing");
    }
  };

  // Generate Student Credentials (Bulk for a class)
  const handleGenerateStudentCredentials = async () => {
    if (!selectedClass) {
      alert("Please select a class");
      return;
    }

    setGeneratingStudents(true);

    try {
      const classData = classes.find(c => c.id === selectedClass);
      if (!classData || !classData.students || classData.students.length === 0) {
        alert("No students found in this class");
        setGeneratingStudents(false);
        return;
      }

      const classStudents = students.filter(s => classData.students.includes(s.docId));
      
      let successCount = 0;
      let errorCount = 0;

      for (const student of classStudents) {
        try {
          const userId = student.rollNo || `STU${student.docId.slice(-6)}`;
          
          // Check if credentials already exist
          const q = query(collection(db, "users"), where("id", "==", userId));
          const existingUser = await getDocs(q);
          
          if (existingUser.empty) {
            // Create user credential
            await addDoc(collection(db, "users"), {
              id: userId,
              password: "welcome",
              role: "student",
              studentId: student.docId,
              name: student.name,
              email: student.email,
              rollNo: student.rollNo,
              createdAt: new Date().toISOString(),
            });

            // Update student with credentials info
            await updateDoc(doc(db, "students", student.docId), {
              hasCredentials: true,
              userId: userId,
              updatedAt: new Date().toISOString(),
            });

            successCount++;
          }
        } catch (err) {
          console.error(`Error creating credentials for ${student.name}:`, err);
          errorCount++;
        }
      }

      alert(`✅ Credentials generated!\nSuccess: ${successCount}\nSkipped/Errors: ${errorCount}`);
      setSelectedClass("");
      setShowStudentModal(false);
      fetchStudents();
    } catch (error) {
      console.error("Error generating student credentials:", error);
      alert("Error generating credentials");
    } finally {
      setGeneratingStudents(false);
    }
  };

  // Delete Credentials
  const handleDeleteCredential = async (docId, type) => {
    if (!window.confirm("Are you sure you want to delete these credentials?")) {
      return;
    }

    try {
      // Find and delete from users collection
      const q = query(collection(db, "users"), where(`${type}Id`, "==", docId));
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach(async (document) => {
        await deleteDoc(doc(db, "users", document.id));
      });

      // Update the main collection
      if (type === "teacher") {
        await updateDoc(doc(db, "teachers", docId), {
          hasCredentials: false,
          userId: null,
        });
        fetchTeachers();
      } else if (type === "student") {
        await updateDoc(doc(db, "students", docId), {
          hasCredentials: false,
          userId: null,
        });
        fetchStudents();
      }

      alert("Credentials deleted successfully!");
      if (type === "admin") fetchAdmins();
    } catch (error) {
      console.error("Error deleting credentials:", error);
      alert("Error deleting credentials");
    }
  };

  const teachersWithCredentials = teachers.filter(t => t.hasCredentials);
  const teachersWithoutCredentials = teachers.filter(t => !t.hasCredentials);
  const studentsWithCredentials = students.filter(s => s.hasCredentials);

  return (
    <div className="credentials-container">
      <Sidebar />
      <div className="credentials-main">
        <Link to="/admin" className="back-to-dashboard">
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>

        <div className="credentials-header">
          <div className="header-icon">
            <Lock size={32} />
          </div>
          <div>
            <h2>Credentials Management</h2>
            <p className="subtitle">Create and manage login credentials for admins, teachers, and students</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="credentials-tabs">
          <button
            className={`tab-btn ${activeTab === "admins" ? "active" : ""}`}
            onClick={() => setActiveTab("admins")}
          >
            <Shield className="tab-icon" size={20} />
            <span className="tab-label">Admins</span>
            <span className="tab-count">{admins.length}</span>
          </button>
          <button
            className={`tab-btn ${activeTab === "teachers" ? "active" : ""}`}
            onClick={() => setActiveTab("teachers")}
          >
            <Users className="tab-icon" size={20} />
            <span className="tab-label">Teachers</span>
            <span className="tab-count">{teachersWithCredentials.length}/{teachers.length}</span>
          </button>
          <button
            className={`tab-btn ${activeTab === "students" ? "active" : ""}`}
            onClick={() => setActiveTab("students")}
          >
            <GraduationCap className="tab-icon" size={20} />
            <span className="tab-label">Students</span>
            <span className="tab-count">{studentsWithCredentials.length}/{students.length}</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* ADMINS TAB */}
          {activeTab === "admins" && (
            <div className="admin-section">
              <div className="section-header">
                <h3>Admin Accounts</h3>
                <button
                  className="create-btn"
                  onClick={() => {
                    setEditingAdmin(null);
                    setNewAdmin({ name: "", email: "", id: "", password: "" });
                    setShowAdminModal(true);
                  }}
                >
                  <UserPlus size={18} />
                  Add New Admin
                </button>
              </div>

              <div className="credentials-grid">
                {admins.map((admin) => (
                  <div key={admin.docId} className="credential-card">
                    <div className="card-avatar">
                      <img
                        src={`https://ui-avatars.com/api/?name=${admin.name}&background=2d5f3f&color=fff`}
                        alt={admin.name}
                      />
                    </div>
                    <div className="card-info">
                      <h4>{admin.name}</h4>
                      <p className="email">
                        <Mail size={14} className="inline-icon" />
                        {admin.email}
                      </p>
                      <div className="credential-details">
                        <div className="detail-item">
                          <User size={14} className="detail-icon" />
                          <span className="label">User ID:</span>
                          <span className="value">{admin.id}</span>
                        </div>
                        <div className="detail-item">
                          <Key size={14} className="detail-icon" />
                          <span className="label">Password:</span>
                          <span className="value">••••••••</span>
                        </div>
                      </div>
                    </div>
                    <div className="card-actions">
                      <button
                        className="action-btn edit-btn"
                        onClick={() => handleEditAdmin(admin)}
                        title="Edit credentials"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDeleteCredential(admin.docId, "admin")}
                        title="Delete credentials"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TEACHERS TAB */}
          {activeTab === "teachers" && (
            <div className="teacher-section">
              <div className="section-header">
                <h3>Teacher Credentials</h3>
                <button
                  className="create-btn"
                  onClick={() => {
                    setEditingTeacher(null);
                    setSelectedTeacher(null);
                    setTeacherCredentials({ id: "", password: "" });
                    setShowTeacherModal(true);
                  }}
                >
                  <UserPlus size={18} />
                  Create Teacher Login
                </button>
              </div>

              <div className="credentials-list">
                <h4 className="list-title">Teachers with Credentials ({teachersWithCredentials.length})</h4>
                {teachersWithCredentials.length > 0 ? (
                  <div className="credentials-grid">
                    {teachersWithCredentials.map((teacher) => (
                      <div key={teacher.docId} className="credential-card">
                        <div className="card-avatar">
                          <img
                            src={teacher.photoURL || `https://ui-avatars.com/api/?name=${teacher.name}&background=10b981&color=fff`}
                            alt={teacher.name}
                          />
                        </div>
                        <div className="card-info">
                          <h4>{teacher.name}</h4>
                          <p className="email">
                            <Mail size={14} className="inline-icon" />
                            {teacher.email}
                          </p>
                          <div className="credential-details">
                            <div className="detail-item">
                              <User size={14} className="detail-icon" />
                              <span className="label">User ID:</span>
                              <span className="value">{teacher.userId}</span>
                            </div>
                            <div className="detail-item">
                              <ChevronRight size={14} className="detail-icon" />
                              <span className="label">Department:</span>
                              <span className="value">{teacher.department || "N/A"}</span>
                            </div>
                          </div>
                        </div>
                        <div className="card-actions">
                          <button
                            className="action-btn edit-btn"
                            onClick={() => handleEditTeacher(teacher)}
                            title="Edit credentials"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="action-btn delete-btn"
                            onClick={() => handleDeleteCredential(teacher.docId, "teacher")}
                            title="Delete credentials"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-message">No teacher credentials created yet</p>
                )}

                <h4 className="list-title" style={{marginTop: '40px'}}>Teachers without Credentials ({teachersWithoutCredentials.length})</h4>
                {teachersWithoutCredentials.length > 0 ? (
                  <div className="teachers-without-credentials">
                    {teachersWithoutCredentials.map((teacher) => (
                      <div key={teacher.docId} className="teacher-item-small">
                        <img
                          src={teacher.photoURL || `https://ui-avatars.com/api/?name=${teacher.name}&background=94a3b8&color=fff`}
                          alt={teacher.name}
                        />
                        <div>
                          <div className="teacher-name-small">{teacher.name}</div>
                          <div className="teacher-dept-small">{teacher.department || "Teacher"}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-message">All teachers have credentials</p>
                )}
              </div>
            </div>
          )}

          {/* STUDENTS TAB */}
          {activeTab === "students" && (
            <div className="student-section">
              <div className="section-header">
                <h3>Student Credentials</h3>
                <button
                  className="create-btn"
                  onClick={() => setShowStudentModal(true)}
                >
                  <UserPlus size={18} />
                  Generate for Class
                </button>
              </div>

              <div className="info-box">
                <Info size={24} className="info-icon" />
                <div>
                  <strong>Default Student Credentials:</strong>
                  <p>User ID: Roll Number | Password: welcome</p>
                </div>
              </div>

              <div className="credentials-grid">
                {studentsWithCredentials.map((student) => (
                  <div key={student.docId} className="credential-card">
                    <div className="card-avatar">
                      <img
                        src={`https://ui-avatars.com/api/?name=${student.name}&background=3b82f6&color=fff`}
                        alt={student.name}
                      />
                    </div>
                    <div className="card-info">
                      <h4>{student.name}</h4>
                      <p className="email">
                        <Mail size={14} className="inline-icon" />
                        {student.email}
                      </p>
                      <div className="credential-details">
                        <div className="detail-item">
                          <User size={14} className="detail-icon" />
                          <span className="label">User ID:</span>
                          <span className="value">{student.userId}</span>
                        </div>
                        <div className="detail-item">
                          <ChevronRight size={14} className="detail-icon" />
                          <span className="label">Roll No:</span>
                          <span className="value">{student.rollNo}</span>
                        </div>
                        <div className="detail-item">
                          <Key size={14} className="detail-icon" />
                          <span className="label">Password:</span>
                          <span className="value">welcome</span>
                        </div>
                      </div>
                    </div>
                    <button
                      className="action-btn delete-btn single-action"
                      onClick={() => handleDeleteCredential(student.docId, "student")}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ADD/EDIT ADMIN MODAL */}
        {showAdminModal && (
          <div className="modal-overlay" onClick={() => {
            setShowAdminModal(false);
            setEditingAdmin(null);
            setNewAdmin({ name: "", email: "", id: "", password: "" });
          }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingAdmin ? "Edit Admin" : "Add New Admin"}</h3>
                <button className="close-btn" onClick={() => {
                  setShowAdminModal(false);
                  setEditingAdmin(null);
                  setNewAdmin({ name: "", email: "", id: "", password: "" });
                }}>
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAddAdmin} className="credential-form">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    placeholder="Enter admin name"
                    value={newAdmin.name}
                    onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    placeholder="admin@school.com"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>User ID *</label>
                  <input
                    type="text"
                    placeholder="e.g., admin001"
                    value={newAdmin.id}
                    onChange={(e) => setNewAdmin({ ...newAdmin, id: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                    required
                  />
                </div>
                <div className="form-actions">
                  <button type="button" className="cancel-btn" onClick={() => {
                    setShowAdminModal(false);
                    setEditingAdmin(null);
                    setNewAdmin({ name: "", email: "", id: "", password: "" });
                  }}>
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn">
                    {editingAdmin ? "Update Admin" : "Create Admin"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CREATE/EDIT TEACHER CREDENTIALS MODAL */}
        {showTeacherModal && (
          <div className="modal-overlay" onClick={() => {
            setShowTeacherModal(false);
            setEditingTeacher(null);
            setSelectedTeacher(null);
            setTeacherCredentials({ id: "", password: "" });
          }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingTeacher ? "Edit Teacher Credentials" : "Create Teacher Login"}</h3>
                <button className="close-btn" onClick={() => {
                  setShowTeacherModal(false);
                  setEditingTeacher(null);
                  setSelectedTeacher(null);
                  setTeacherCredentials({ id: "", password: "" });
                }}>
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleGenerateTeacherCredentials} className="credential-form">
                {!editingTeacher && (
                  <div className="form-group">
                    <label>Select Teacher *</label>
                    <select
                      value={selectedTeacher?.docId || ""}
                      onChange={(e) => {
                        const teacher = teachersWithoutCredentials.find(t => t.docId === e.target.value);
                        setSelectedTeacher(teacher);
                        if (teacher) {
                          setTeacherCredentials({
                            ...teacherCredentials,
                            id: `TCH${teacher.docId.slice(-6)}`
                          });
                        }
                      }}
                      required
                    >
                      <option value="">-- Select Teacher --</option>
                      {teachersWithoutCredentials.map((teacher) => (
                        <option key={teacher.docId} value={teacher.docId}>
                          {teacher.name} - {teacher.department}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {(selectedTeacher || editingTeacher) && (
                  <>
                    {editingTeacher && (
                      <div className="info-box" style={{marginBottom: '20px'}}>
                        <Users size={24} className="info-icon" />
                        <div>
                          <strong>{editingTeacher.name}</strong>
                          <p>{editingTeacher.department}</p>
                        </div>
                      </div>
                    )}
                    <div className="form-group">
                      <label>User ID *</label>
                      <input
                        type="text"
                        placeholder="e.g., TCH001"
                        value={teacherCredentials.id}
                        onChange={(e) => setTeacherCredentials({ ...teacherCredentials, id: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Password *</label>
                      <input
                        type="password"
                        placeholder="Enter password"
                        value={teacherCredentials.password}
                        onChange={(e) => setTeacherCredentials({ ...teacherCredentials, password: e.target.value })}
                        required
                      />
                    </div>
                  </>
                )}
                <div className="form-actions">
                  <button type="button" className="cancel-btn" onClick={() => {
                    setShowTeacherModal(false);
                    setEditingTeacher(null);
                    setSelectedTeacher(null);
                    setTeacherCredentials({ id: "", password: "" });
                  }}>
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn">
                    {editingTeacher ? "Update Credentials" : "Create Credentials"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* STUDENT CREDENTIALS MODAL */}
        {showStudentModal && (
          <div className="modal-overlay" onClick={() => setShowStudentModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Generate Student Credentials</h3>
                <button className="close-btn" onClick={() => setShowStudentModal(false)}>
                  <X size={24} />
                </button>
              </div>
              <div className="credential-form">
                <div className="info-box" style={{marginBottom: '20px'}}>
                  <Info size={24} className="info-icon" />
                  <div>
                    <p>This will generate credentials for all students in the selected class.</p>
                    <p><strong>Default: User ID = Roll Number, Password = "welcome"</strong></p>
                  </div>
                </div>
                <div className="form-group">
                  <label>Select Class *</label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    required
                  >
                    <option value="">-- Select Class --</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} - {cls.students?.length || 0} students
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setShowStudentModal(false)}
                    disabled={generatingStudents}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="submit-btn"
                    onClick={handleGenerateStudentCredentials}
                    disabled={generatingStudents}
                  >
                    {generatingStudents ? "Generating..." : "Generate Credentials"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Credentials;