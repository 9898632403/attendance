// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import FacultyDashboard from "./pages/FacultyDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import Library from "./pages/Library";
import AdminDashboard from "./pages/AdminDashboard"; // new admin dashboard

// ProtectedRoute wrapper
const ProtectedRoute = ({ children, role }) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!user?.email) return <Navigate to="/login" />;

  if (role) {
    if (role === "admin" && user.role !== "admin") return <Navigate to="/login" />;
    if (role !== "admin" && user.role !== role) return <Navigate to="/login" />;
  }

  return children;
};

// Default route after login
const DefaultRoute = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!user?.email) return <Navigate to="/login" />;

  if (user.role === "admin") return <Navigate to="/admin/dashboard" />;
  if (user.role === "faculty") return <Navigate to="/faculty-dashboard" />;
  if (user.role === "student") return <Navigate to="/student-dashboard" />;

  return <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DefaultRoute />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty-dashboard"
          element={
            <ProtectedRoute role="faculty">
              <FacultyDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-dashboard"
          element={
            <ProtectedRoute role="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/library"
          element={
            <ProtectedRoute>
              <Library />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
