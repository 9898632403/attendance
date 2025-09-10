// src/components/AttendanceTable.jsx
import React, { useState, useEffect } from "react";
import "../styles/AttendanceTable.css";

const AttendanceTable = ({ students = [], attendance = [] }) => {
  const [sortedStudents, setSortedStudents] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: "rollNo", direction: "asc" });
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading for better UX
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Get attendance status for a student
  const getStatus = (studentId) => {
    const record = attendance.find((a) => a.studentId === studentId);
    return record ? record.status : "absent";
  };

  // Sort students based on configuration
  useEffect(() => {
    let sortableItems = [...students];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    setSortedStudents(sortableItems);
  }, [students, sortConfig]);

  // Filter students based on search term
  useEffect(() => {
    const filtered = sortedStudents.filter(
      (student) =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.rollNo.toString().includes(searchTerm)
    );
    setFilteredStudents(filtered);
  }, [searchTerm, sortedStudents]);

  // Handle sorting
  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Get sort indicator
  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return "↕";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  // If no students provided
  if (!students.length && !isLoading) {
    return (
      <div className="attendance-container">
        <h2 className="attendance-title">Attendance Records</h2>
        <div className="no-students">
          <div className="no-students-icon">👨‍🎓</div>
          <p>No students available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="attendance-container">
      <h2 className="attendance-title">Attendance Records</h2>
      
      {/* Search and filter section */}
      <div className="table-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name or roll no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
        
        <div className="summary">
          <span className="present-count">
            Present: {students.filter(s => getStatus(s.id) === "present").length}
          </span>
          <span className="absent-count">
            Absent: {students.filter(s => getStatus(s.id) === "absent").length}
          </span>
        </div>
      </div>

      {/* Attendance table */}
      <div className="table-wrapper">
        <table className="attendance-table">
          <thead>
            <tr>
              <th 
                onClick={() => requestSort("rollNo")}
                className="sortable-header"
              >
                <div className="header-content">
                  Roll No {getSortIndicator("rollNo")}
                </div>
              </th>
              <th 
                onClick={() => requestSort("name")}
                className="sortable-header"
              >
                <div className="header-content">
                  Name {getSortIndicator("name")}
                </div>
              </th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="loading-row">
                  <td><div className="loading-skeleton"></div></td>
                  <td><div className="loading-skeleton"></div></td>
                  <td><div className="loading-skeleton"></div></td>
                </tr>
              ))
            ) : filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="3" className="no-results">
                  <div className="no-results-content">
                    <span className="no-results-icon">🔍</span>
                    <p>No students match your search</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredStudents.map((stu, index) => (
                <tr key={stu.id} className="fade-in-row" style={{ animationDelay: `${index * 0.05}s` }}>
                  <td className="roll-no-cell">{stu.rollNo || "-"}</td>
                  <td className="name-cell">{stu.name || "Unknown"}</td>
                  <td className="status-cell">
                    <span className={`status-badge ${getStatus(stu.id)}`}>
                      {getStatus(stu.id)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceTable;