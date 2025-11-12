// src/pages/Mapping.js
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../pages/components/Sidebar";
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Map,
  Users,
  BookOpen,
  GraduationCap,
  X,
  Search,
  Check,
  UserCheck,
  MapPin
} from "lucide-react";
import "../styles/Mapping.css";

function Mapping() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  
  // Create Class Form
  const [newClass, setNewClass] = useState({
    name: "",
    grade: "",
    section: "",
  });

  // Mapping Form
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherSearch, setTeacherSearch] = useState("");
  const [mappings, setMappings] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
    fetchStudents();
  }, []);

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

  const fetchStudents = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "students"));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setStudents(data);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!newClass.name || !newClass.grade) {
      alert("Please fill in class name and grade");
      return;
    }

    try {
      await addDoc(collection(db, "classes"), {
        ...newClass,
        mappings: [],
        students: [],
        createdAt: new Date().toISOString(),
      });
      alert("Class created successfully!");
      setNewClass({ name: "", grade: "", section: "" });
      setShowCreateModal(false);
      fetchClasses();
    } catch (error) {
      console.error("Error creating class:", error);
      alert("Error creating class");
    }
  };

  const handleDeleteClass = async (classId) => {
    if (window.confirm("Are you sure you want to delete this class?")) {
      try {
        await deleteDoc(doc(db, "classes", classId));
        alert("Class deleted successfully!");
        fetchClasses();
      } catch (error) {
        console.error("Error deleting class:", error);
        alert("Error deleting class");
      }
    }
  };

  const openMappingModal = (classItem) => {
    setSelectedClass(classItem);
    setMappings(classItem.mappings || []);
    setSelectedStudents(classItem.students || []);
    setShowMappingModal(true);
    setSelectedTeacher(null);
    setTeacherSearch("");
  };

  const handleSelectTeacher = (teacher) => {
    setSelectedTeacher(teacher);
  };

  const handleAddMapping = () => {
    if (!selectedTeacher) {
      alert("Please select a teacher");
      return;
    }

    const newMapping = {
      teacherId: selectedTeacher.id,
      teacherName: selectedTeacher.name,
      subject: "",
      isHomeroom: false,
    };

    setMappings([...mappings, newMapping]);
    setSelectedTeacher(null);
    setTeacherSearch("");
  };

  const handleUpdateMapping = (index, field, value) => {
    const updated = [...mappings];
    updated[index][field] = value;
    
    // Only one homeroom teacher
    if (field === "isHomeroom" && value === true) {
      updated.forEach((mapping, i) => {
        if (i !== index) mapping.isHomeroom = false;
      });
    }
    
    setMappings(updated);
  };

  const handleRemoveMapping = (index) => {
    setMappings(mappings.filter((_, i) => i !== index));
  };

  const handleToggleStudent = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  const handleSaveMappings = async () => {
    if (mappings.length === 0) {
      alert("Please add at least one teacher mapping");
      return;
    }

    const homeroomCount = mappings.filter(m => m.isHomeroom).length;
    if (homeroomCount === 0) {
      alert("Please assign a homeroom teacher");
      return;
    }

    try {
      await updateDoc(doc(db, "classes", selectedClass.id), {
        mappings: mappings,
        students: selectedStudents,
        updatedAt: new Date().toISOString(),
      });
      alert("Mappings saved successfully!");
      setShowMappingModal(false);
      fetchClasses();
    } catch (error) {
      console.error("Error saving mappings:", error);
      alert("Error saving mappings");
    }
  };

  const filteredTeachers = teachers.filter(t => 
    t.name?.toLowerCase().includes(teacherSearch.toLowerCase())
  );

  return (
    <div className="mapping-container">
      <Sidebar />
      <div className="mapping-main">
        <Link to="/admin" className="back-to-dashboard">
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>

        <div className="mapping-header">
          <div className="header-left">
            <div className="header-icon">
              <MapPin size={32} />
            </div>
            <div className="header-text">
              <h2>Class & Teacher Mapping</h2>
              <p className="subtitle">Create classes and assign teachers to subjects</p>
            </div>
          </div>
        </div>

        {/* Create Class Card */}
        <div className="create-class-card">
          <div className="card-content">
            <div className="card-icon">
              <Plus size={28} />
            </div>
            <div className="card-text">
              <h3>Create New Class</h3>
              <p>Set up a new class and organize your students</p>
            </div>
          </div>
          <button 
            className="create-class-btn"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={18} />
            Create Class
          </button>
        </div>

        {/* Classes List */}
        <div className="mapping-classes-grid">
          {classes.map((classItem) => (
            <div key={classItem.id} className="mapping-class-card">
              <div className="mapping-class-header">
                <h3>{classItem.name}</h3>
                <button 
                  className="mapping-delete-btn"
                  onClick={() => handleDeleteClass(classItem.id)}
                  title="Delete class"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              
              <div className="mapping-badge-row">
                <span className="mapping-grade-badge">Grade {classItem.grade}</span>
                {classItem.section && <span className="mapping-section-badge">Section {classItem.section}</span>}
              </div>

              <div className="mapping-stats">
                <div className="mapping-stat-item">
                  <div className="mapping-stat-icon teachers">
                    <Users size={18} />
                  </div>
                  <div className="mapping-stat-info">
                    <span className="mapping-stat-value">{classItem.mappings?.length || 0}</span>
                    <span className="mapping-stat-label">Teachers</span>
                  </div>
                </div>
                <div className="mapping-stat-item">
                  <div className="mapping-stat-icon students">
                    <GraduationCap size={18} />
                  </div>
                  <div className="mapping-stat-info">
                    <span className="mapping-stat-value">{classItem.students?.length || 0}</span>
                    <span className="mapping-stat-label">Students</span>
                  </div>
                </div>
              </div>

              {classItem.mappings?.find(m => m.isHomeroom) && (
                <div className="mapping-homeroom-info">
                  <UserCheck size={16} />
                  <span>Homeroom: {classItem.mappings.find(m => m.isHomeroom).teacherName}</span>
                </div>
              )}

              <button 
                className="mapping-map-btn"
                onClick={() => openMappingModal(classItem)}
              >
                <Map size={18} />
                Map Teachers
              </button>
            </div>
          ))}
        </div>

        {/* Create Class Modal */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Create New Class</h3>
                <button className="close-btn" onClick={() => setShowCreateModal(false)}>
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleCreateClass} className="create-form">
                <div className="form-group">
                  <label>Class Name *</label>
                  <input
                    type="text"
                    placeholder="e.g., Class 10A"
                    value={newClass.name}
                    onChange={(e) => setNewClass({...newClass, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Grade *</label>
                  <input
                    type="text"
                    placeholder="e.g., 10"
                    value={newClass.grade}
                    onChange={(e) => setNewClass({...newClass, grade: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Section</label>
                  <input
                    type="text"
                    placeholder="e.g., A"
                    value={newClass.section}
                    onChange={(e) => setNewClass({...newClass, section: e.target.value})}
                  />
                </div>
                <div className="form-actions">
                  <button type="button" className="cancel-btn" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn">
                    <Check size={18} />
                    Create Class
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Mapping Modal */}
        {showMappingModal && (
          <div className="modal-overlay" onClick={() => setShowMappingModal(false)}>
            <div className="mapping-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Map Teachers to {selectedClass?.name}</h3>
                <button className="close-btn" onClick={() => setShowMappingModal(false)}>
                  <X size={24} />
                </button>
              </div>

              <div className="mapping-progress">
                <div className="progress-step active">
                  <div className="step-number">
                    <Users size={20} />
                  </div>
                  <span>Select Teacher</span>
                </div>
                <div className="progress-line"></div>
                <div className="progress-step active">
                  <div className="step-number">
                    <BookOpen size={20} />
                  </div>
                  <span>Assign Classes & Subjects</span>
                </div>
              </div>

              <div className="mapping-body">
                <div className="mapping-left">
                  <h4>Select Teacher</h4>
                  <div className="search-wrapper">
                    <Search size={18} className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search teachers..."
                      className="teacher-search"
                      value={teacherSearch}
                      onChange={(e) => setTeacherSearch(e.target.value)}
                    />
                  </div>
                  <div className="teachers-list">
                    {filteredTeachers.map((teacher) => (
                      <div
                        key={teacher.id}
                        className={`teacher-item ${selectedTeacher?.id === teacher.id ? 'selected' : ''}`}
                        onClick={() => handleSelectTeacher(teacher)}
                      >
                        <img
                          src={teacher.photoURL || `https://ui-avatars.com/api/?name=${teacher.name}&background=2d5f3f&color=fff`}
                          alt={teacher.name}
                          className="teacher-avatar"
                        />
                        <div className="teacher-details">
                          <div className="teacher-name">{teacher.name}</div>
                          <div className="teacher-dept">{teacher.department || "Department"}</div>
                        </div>
                        <div className={`radio-indicator ${selectedTeacher?.id === teacher.id ? 'selected' : ''}`}>
                          {selectedTeacher?.id === teacher.id && <Check size={14} />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mapping-right">
                  <h4>Assign Classes & Subjects</h4>
                  <p className="teacher-label">Class: {selectedClass?.name}</p>
                  
                  <div className="mappings-list">
                    {mappings.map((mapping, index) => (
                      <div key={index} className="mapping-card">
                        <div className="mapping-header-row">
                          <input
                            type="text"
                            placeholder="Class"
                            value={selectedClass?.name}
                            disabled
                            className="class-input"
                          />
                          <input
                            type="text"
                            placeholder="Subject (e.g., Mathematics)"
                            value={mapping.subject}
                            onChange={(e) => handleUpdateMapping(index, 'subject', e.target.value)}
                            className="subject-input"
                          />
                        </div>
                        <div className="mapping-footer-row">
                          <label className="homeroom-label">
                            <input
                              type="checkbox"
                              checked={mapping.isHomeroom}
                              onChange={(e) => handleUpdateMapping(index, 'isHomeroom', e.target.checked)}
                            />
                            <UserCheck size={16} />
                            Homeroom Teacher
                            {mapping.isHomeroom && <span className="homeroom-badge">Active</span>}
                          </label>
                          <button
                            className="remove-mapping-btn"
                            onClick={() => handleRemoveMapping(index)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="teacher-name-display">
                          <Users size={14} />
                          {mapping.teacherName}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button className="add-assignment-btn" onClick={handleAddMapping}>
                    <Plus size={18} />
                    Add Class Assignment
                  </button>

                  {/* Student Selection */}
                  <div className="student-selection">
                    <h4>
                      <GraduationCap size={20} className="inline-icon" />
                      Assign Students to Class
                    </h4>
                    <div className="students-grid">
                      {students.map((student) => (
                        <label key={student.id} className="student-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student.id)}
                            onChange={() => handleToggleStudent(student.id)}
                          />
                          <span>{student.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="mapping-actions">
                    <button className="cancel-btn" onClick={() => setShowMappingModal(false)}>
                      Cancel
                    </button>
                    <button className="save-btn" onClick={handleSaveMappings}>
                      <Check size={18} />
                      Save Mappings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Mapping;