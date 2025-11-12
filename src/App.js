import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import AdminDashboard from "./pages/AdminDashboard";
import Login from "./pages/Login";
import AddStudent from "./pages/AddStudent";
import AddTeacher from "./pages/AddTeacher";
import ManageTeacher from "./pages/ManageTeacher";
import Mapping from "./pages/MapClasses";
import ManageStudents from "./pages/ManageStudents";
import Credentials from "./pages/Credentials";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherClassDetails from "./pages/ClassDetails";
import Department from "./pages/Departments";
import TeacherProfile from "./pages/TeacherProfile";
import TeacherTests from "./pages/TeacherTests";
import TestInsights from "./pages/TestInsights";
import StudentDashboard from "./pages/StudentDashboard";
import PendingTests from "./pages/PendingTests";
import TestPage from "./pages/TestPage";
import ResultsPage from "./pages/ResultsPage";
import ResultDetailPage from "./pages/ResultDetailPage";
import MyResults from "./pages/MyResults";

function App() {
  const [userType, setUserType] = useState(null);

  const handleLogin = (type) => {
    setUserType(type);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login onLogin={handleLogin} />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/add-student" element={<AddStudent />} />
        <Route path="/add-teacher" element={<AddTeacher />} />
        <Route path="/teachers" element={<ManageTeacher />} />
        <Route path="/map-classes" element={<Mapping />} />
        <Route path="/manage-students" element={<ManageStudents />} />
        <Route path="/credentials" element={<Credentials/>} />
        <Route path="/teacher" element={<TeacherDashboard/>} />
        <Route path="/teacher/class/:classId" element={<TeacherClassDetails />} />
        <Route path="/departments" element={<Department/>} />
        <Route path="/teacher/profile" element={<TeacherProfile/>} />
        <Route path="/teacher/tests" element={<TeacherTests/>} />
        <Route path="/teacher/tests/insights/:testId" element={<TestInsights/>} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/student-dashboard/pending-tests" element={<PendingTests />} />
        <Route path="/student-dashboard/test/:testId" element={<TestPage />} />
        <Route path="/student-dashboard/results" element={<ResultsPage />} />
        <Route path="/student-dashboard/result/:resultId" element={<ResultDetailPage />} />
        <Route path="/student-dashboard/my-results" element={<MyResults />} />
      </Routes>
    </Router>
  );
}

export default App;
