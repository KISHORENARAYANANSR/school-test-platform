import React, { useEffect, useState } from "react";
import TeacherSidebar from "./TeacherSidebar";
import "../styles/TeacherProfile.css";
import { db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

const TeacherProfile = () => {
  const [teacher, setTeacher] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        const storedDocId = localStorage.getItem("teacherDocId");

        if (!storedDocId) {
          setError("No valid login information found.");
          setLoading(false);
          return;
        }

        const teacherRef = doc(db, "teachers", storedDocId);
        const teacherSnap = await getDoc(teacherRef);

        if (!teacherSnap.exists()) {
          setError("Teacher profile not found.");
          setLoading(false);
          return;
        }

        const teacherData = teacherSnap.data();
        setTeacher(teacherData);
        setFormData(teacherData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile.");
        setLoading(false);
      }
    };

    fetchTeacherData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage("");

      const storedDocId = localStorage.getItem("teacherDocId");
      const teacherRef = doc(db, "teachers", storedDocId);

      await updateDoc(teacherRef, formData);

      setTeacher(formData);
      setIsEditing(false);
      setSuccessMessage("Profile updated successfully!");

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(teacher);
    setIsEditing(false);
    setError(null);
  };

  if (loading) {
    return (
      <div className="teacher-dashboard-wrapper">
        <TeacherSidebar />
        <div className="teacher-profile-main">
          <div className="loading-spinner">Loading…</div>
        </div>
      </div>
    );
  }

  if (error && !teacher) {
    return (
      <div className="teacher-dashboard-wrapper">
        <TeacherSidebar />
        <div className="teacher-profile-main">
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-dashboard-wrapper">
      <TeacherSidebar />
      
      <div className="teacher-profile-main">
        <div className="profile-header">
          <div>
            <h1 className="profile-title">My Profile</h1>
            <p className="profile-subtitle">Manage your personal information</p>
          </div>
          
          {!isEditing ? (
            <button className="btn-edit" onClick={() => setIsEditing(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeWidth="2"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeWidth="2"/>
              </svg>
              Edit Profile
            </button>
          ) : (
            <div className="edit-actions">
              <button className="btn-cancel" onClick={handleCancel} disabled={saving}>
                Cancel
              </button>
              <button className="btn-save" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>

        {successMessage && (
          <div className="success-message">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="20 6 9 17 4 12" strokeWidth="2"/>
            </svg>
            {successMessage}
          </div>
        )}

        {error && (
          <div className="error-message-inline">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
              <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2"/>
              <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2"/>
            </svg>
            {error}
          </div>
        )}

        <div className="profile-card">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="2"/>
                <circle cx="12" cy="7" r="4" strokeWidth="2"/>
              </svg>
            </div>
            <div className="profile-avatar-info">
              <h2>{formData.name || "Teacher Name"}</h2>
              <p>{formData.teacherId || "ID not set"}</p>
            </div>
          </div>

          <div className="profile-form">
            <div className="form-section">
              <h3 className="section-heading">Personal Information</h3>
              
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name || ""}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <div className="form-value">{formData.name || "Not set"}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Teacher ID</label>
                  <div className="form-value">{formData.teacherId || "Not set"}</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email || ""}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Enter your email"
                    />
                  ) : (
                    <div className="form-value">{formData.email || "Not set"}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone || ""}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <div className="form-value">{formData.phone || "Not set"}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="section-heading">Professional Information</h3>
              
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Department</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="department"
                      value={formData.department || ""}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Enter your department"
                    />
                  ) : (
                    <div className="form-value">{formData.department || "Not set"}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Subject</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject || ""}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Enter your subject"
                    />
                  ) : (
                    <div className="form-value">{formData.subject || "Not set"}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Qualification</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="qualification"
                      value={formData.qualification || ""}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Enter your qualification"
                    />
                  ) : (
                    <div className="form-value">{formData.qualification || "Not set"}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Experience (Years)</label>
                  {isEditing ? (
                    <input
                      type="number"
                      name="experience"
                      value={formData.experience || ""}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Enter years of experience"
                    />
                  ) : (
                    <div className="form-value">{formData.experience || "Not set"}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="section-heading">Additional Information</h3>
              
              <div className="form-group full-width">
                <label className="form-label">Address</label>
                {isEditing ? (
                  <textarea
                    name="address"
                    value={formData.address || ""}
                    onChange={handleInputChange}
                    className="form-textarea"
                    placeholder="Enter your address"
                    rows="3"
                  />
                ) : (
                  <div className="form-value">{formData.address || "Not set"}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfile;