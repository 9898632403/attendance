// src/components/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import Timetable from "./Timetable";
import EnrollForm from "./EnrollForm";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("timetable");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [students, setStudents] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");
  const adminEmails = ["admin@example.com", "head@example.com", "admin@iar.com"];

  useEffect(() => {
    if (user?.role === "admin" && adminEmails.includes(user.email)) {
      setIsAuthorized(true);
      fetchAllUsers();
    } else {
      setIsAuthorized(false);
    }
  }, [user]);

  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/users`, {
        headers: {
          "X-User-Email": user?.email,
          role: user?.role,
          Authorization: token,
        },
      });

      const allUsers = res.data || [];
      setStudents(allUsers.filter(u => u.role === "student"));
      setFaculties(allUsers.filter(u => u.role === "faculty"));
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/users/${userId}`, {
        headers: {
          "X-User-Email": user?.email,
          role: user?.role,
          Authorization: token,
        },
      });
      fetchAllUsers();
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (!isAuthorized) {
    return (
      <div className="p-6 text-center text-red-600">
        You are not authorized to access this page.
      </div>
    );
  }

  return (
    <div className="admin-dashboard container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "timetable" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("timetable")}
        >
          Timetables
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "students" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("students")}
        >
          Students
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "faculties" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("faculties")}
        >
          Faculties
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "enroll" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("enroll")}
        >
          Enroll Users
        </button>
      </div>

      {/* Content */}
      <div>
        {activeTab === "timetable" && (
          <Timetable adminView={true} user={user} token={token} />
        )}

        {activeTab === "students" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">All Students</h2>
            {loading ? (
              <p>Loading...</p>
            ) : students.length === 0 ? (
              <p>No students found</p>
            ) : (
              <table className="w-full border-collapse border">
                <thead>
                  <tr>
                    <th className="border p-2">Name</th>
                    <th className="border p-2">Email</th>
                    <th className="border p-2">Branch</th>
                    <th className="border p-2">Semester</th>
                    <th className="border p-2">Mobile</th>
                    <th className="border p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s._id}>
                      <td className="border p-2">{s.name}</td>
                      <td className="border p-2">{s.email}</td>
                      <td className="border p-2">{s.extra_info?.branch || "-"}</td>
                      <td className="border p-2">{s.extra_info?.sem || "-"}</td>
                      <td className="border p-2">{s.extra_info?.mobile || "-"}</td>
                      <td className="border p-2">
                        <button
                          className="bg-red-600 text-white px-2 py-1 rounded"
                          onClick={() => handleDeleteUser(s._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "faculties" && (
          <div>
            <h2 className="text-xl font-semibold mb-4">All Faculties</h2>
            {loading ? (
              <p>Loading...</p>
            ) : faculties.length === 0 ? (
              <p>No faculties found</p>
            ) : (
              <table className="w-full border-collapse border">
                <thead>
                  <tr>
                    <th className="border p-2">Name</th>
                    <th className="border p-2">Email</th>
                    <th className="border p-2">Subjects</th>
                    <th className="border p-2">Faculty Code</th>
                    <th className="border p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {faculties.map((f) => (
                    <tr key={f._id}>
                      <td className="border p-2">{f.name}</td>
                      <td className="border p-2">{f.email}</td>
                      <td className="border p-2">{(f.extra_info?.subjects || []).join(", ")}</td>
                      <td className="border p-2">{f.extra_info?.facultyCode}</td>
                      <td className="border p-2">
                        <button
                          className="bg-red-600 text-white px-2 py-1 rounded"
                          onClick={() => handleDeleteUser(f._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === "enroll" && (
          <EnrollForm adminEmail={user.email} user={user} token={token} />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
