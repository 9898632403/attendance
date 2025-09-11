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
  const API_BASE_URL = process.env.REACT_APP_API_URL || "";

  useEffect(() => {
    if (user?.role === "admin" && adminEmails.includes(user.email)) {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
    }
  }, [user]);

  // Fetch data whenever "students" or "faculty" tab is active
  useEffect(() => {
    if (activeTab === "students" || activeTab === "faculty") {
      fetchData();
    }
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setMessage("");
    try {
      let endpoint = activeTab === "students" ? "/api/admin/students" : "/api/admin/faculty";
      const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
        headers: { "X-User-Email": user.email, "Authorization": `Bearer ${token}` }
      });
      if (activeTab === "students") setStudents(response.data || []);
      else setFaculty(response.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      if (error.response?.status === 404) setMessage("API endpoint not found.");
      else if (error.response?.status === 403) setMessage("You are not authorized.");
      else setMessage("Error fetching data.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (email) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/admin/user/${email}`, {
        headers: { "X-User-Email": user.email, "Authorization": `Bearer ${token}` }
      });
      setMessage("User deleted successfully");
      fetchData();
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
    return <div className="p-6 text-center text-red-600">You are not authorized to access this page.</div>;
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

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["timetable", "enroll", "students", "faculty"].map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 rounded ${activeTab === tab ? "bg-blue-600 text-white" : "bg-gray-200"}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "timetable" ? "Create Timetable" :
             tab === "enroll" ? "Enroll Users" :
             tab === "students" ? "Manage Students" : "Manage Faculty"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "timetable" && <Timetable adminView={true} user={user} token={token} />}
        {activeTab === "enroll" && <EnrollForm adminEmail={user.email} user={user} token={token} students={students} faculty={faculty} />}
        {activeTab === "students" && (
          <DataTable data={students} type="student" onDelete={handleDeleteUser} loading={loading} />
        )}
        {activeTab === "faculty" && (
          <DataTable data={faculty} type="faculty" onDelete={handleDeleteUser} loading={loading} />
        )}
      </div>
    </div>
  );
};

// Reusable DataTable for students/faculty
const DataTable = ({ data, type, onDelete, loading }) => {
  if (loading) return <p>Loading {type === "student" ? "students" : "faculty"}...</p>;
  if (!data.length) return <p>No {type === "student" ? "students" : "faculty"} found.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b">Name</th>
            <th className="py-2 px-4 border-b">Email</th>
            {type === "student" && <>
              <th className="py-2 px-4 border-b">Branch</th>
              <th className="py-2 px-4 border-b">Semester</th>
              <th className="py-2 px-4 border-b">Mobile</th>
            </>}
            {type === "faculty" && <>
              <th className="py-2 px-4 border-b">Faculty Code</th>
              <th className="py-2 px-4 border-b">Subjects</th>
            </>}
            <th className="py-2 px-4 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.email}>
              <td className="py-2 px-4 border-b">{item.name}</td>
              <td className="py-2 px-4 border-b">{item.email}</td>
              {type === "student" && <>
                <td className="py-2 px-4 border-b">{item.extra_info?.branch}</td>
                <td className="py-2 px-4 border-b">{item.extra_info?.sem}</td>
                <td className="py-2 px-4 border-b">{item.extra_info?.mobile}</td>
              </>}
              {type === "faculty" && <>
                <td className="py-2 px-4 border-b">{item.extra_info?.facultyCode}</td>
                <td className="py-2 px-4 border-b">{item.extra_info?.subjects?.join(", ")}</td>
              </>}
              <td className="py-2 px-4 border-b">
                <button onClick={() => onDelete(item.email)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;
