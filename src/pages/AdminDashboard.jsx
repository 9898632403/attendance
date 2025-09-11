import React, { useState, useEffect } from "react";
import Timetable from "./Timetable";
import EnrollForm from "./EnrollForm";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("timetable");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");
  const adminEmails = ["admin@example.com", "head@example.com", "admin@iar.com", "head@iar.com"];

  // Base URL for API calls - adjust based on your environment
  const API_BASE_URL = process.env.REACT_APP_API_URL || "";

  useEffect(() => {
    if (user?.role === "admin" && adminEmails.includes(user.email)) {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === "students" || activeTab === "faculty") {
      fetchData();
    }
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setMessage("");
      
      let endpoint = "";
      if (activeTab === "students") {
        endpoint = "/api/admin/students";
      } else if (activeTab === "faculty") {
        endpoint = "/api/admin/faculty";
      }
      
      const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
        headers: {
          "X-User-Email": user.email,
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (activeTab === "students") {
        setStudents(response.data);
      } else {
        setFaculty(response.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      if (error.response?.status === 404) {
        setMessage("API endpoint not found. Please check if the backend has the required routes.");
      } else if (error.response?.status === 403) {
        setMessage("You are not authorized to access this data.");
      } else {
        setMessage("Error fetching data. Please check the console for details.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (email) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      const response = await axios.delete(`${API_BASE_URL}/api/admin/user/${email}`, {
        headers: {
          "X-User-Email": user.email,
          "Authorization": `Bearer ${token}`
        }
      });
      
      setMessage("User deleted successfully");
      fetchData(); // Refresh the list
    } catch (error) {
      console.error("Error deleting user:", error);
      setMessage("Error deleting user");
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

      {message && (
        <div className={`mb-4 p-3 rounded ${message.includes("Error") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
          {message}
        </div>
      )}

      {/* Tabs to switch */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "timetable" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("timetable")}
        >
          Create Timetable
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "enroll" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("enroll")}
        >
          Enroll Users
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "students" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("students")}
        >
          Manage Students
        </button>
        <button
          className={`px-4 py-2 rounded ${
            activeTab === "faculty" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("faculty")}
        >
          Manage Faculty
        </button>
      </div>

      {/* Content based on active tab */}
      <div>
        {activeTab === "timetable" && (
          <Timetable adminView={true} user={user} token={token} />
        )}
        {activeTab === "enroll" && (
          <EnrollForm adminEmail={user.email} user={user} token={token} />
        )}
        {activeTab === "students" && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Manage Students</h2>
            {loading ? (
              <p>Loading students...</p>
            ) : students.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border">
                  <thead>
                    <tr>
                      <th className="py-2 px-4 border-b">Name</th>
                      <th className="py-2 px-4 border-b">Email</th>
                      <th className="py-2 px-4 border-b">Branch</th>
                      <th className="py-2 px-4 border-b">Semester</th>
                      <th className="py-2 px-4 border-b">Mobile</th>
                      <th className="py-2 px-4 border-b">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.email}>
                        <td className="py-2 px-4 border-b">{student.name}</td>
                        <td className="py-2 px-4 border-b">{student.email}</td>
                        <td className="py-2 px-4 border-b">{student.extra_info?.branch}</td>
                        <td className="py-2 px-4 border-b">{student.extra_info?.sem}</td>
                        <td className="py-2 px-4 border-b">{student.extra_info?.mobile}</td>
                        <td className="py-2 px-4 border-b">
                          <button
                            onClick={() => handleDeleteUser(student.email)}
                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No students found.</p>
            )}
          </div>
        )}
        {activeTab === "faculty" && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Manage Faculty</h2>
            {loading ? (
              <p>Loading faculty...</p>
            ) : faculty.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border">
                  <thead>
                    <tr>
                      <th className="py-2 px-4 border-b">Name</th>
                      <th className="py-2 px-4 border-b">Email</th>
                      <th className="py-2 px-4 border-b">Faculty Code</th>
                      <th className="py-2 px-4 border-b">Subjects</th>
                      <th className="py-2 px-4 border-b">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {faculty.map((fac) => (
                      <tr key={fac.email}>
                        <td className="py-2 px-4 border-b">{fac.name}</td>
                        <td className="py-2 px-4 border-b">{fac.email}</td>
                        <td className="py-2 px-4 border-b">{fac.extra_info?.facultyCode}</td>
                        <td className="py-2 px-4 border-b">
                          {fac.extra_info?.subjects?.join(", ")}
                        </td>
                        <td className="py-2 px-4 border-b">
                          <button
                            onClick={() => handleDeleteUser(fac.email)}
                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No faculty members found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;