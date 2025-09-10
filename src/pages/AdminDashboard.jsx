import React, { useState, useEffect } from "react";
import Timetable from "./Timetable";
import EnrollForm from "./EnrollForm";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("timetable");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");
  const adminEmails = ["admin@example.com", "head@example.com", "admin@iar.com"];

  useEffect(() => {
    if (user?.role === "admin" && adminEmails.includes(user.email)) {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
    }
  }, [user]);

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

      {/* Tabs to switch */}
      <div className="flex gap-4 mb-6">
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
      </div>

      {/* Pass user + token as props so child components can call backend */}
      <div>
        {activeTab === "timetable" && (
          <Timetable adminView={true} user={user} token={token} />
        )}
        {activeTab === "enroll" && (
          <EnrollForm adminEmail={user.email} user={user} token={token} />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
