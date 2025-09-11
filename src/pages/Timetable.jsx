// src/components/TimetableSimple.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import QRCode from "react-qr-code";

const TimetableSimple = ({ adminView = false, user, token }) => {
  const [branches, setBranches] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [selected, setSelected] = useState({ branch: "", semester: "" });
  const [lectures, setLectures] = useState({});
  const [liveLecture, setLiveLecture] = useState(null);
  const [qrCode, setQrCode] = useState("");

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  useEffect(() => {
    if (adminView) {
      fetchBranches();
      fetchFaculties();
    } else {
      fetchBranches(); // for students/faculty view
    }
    const interval = setInterval(() => generateLiveQr(), 5000);
    return () => clearInterval(interval);
  }, [adminView]);

  const fetchBranches = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/timetables`, {
        headers: { "X-User-Email": user?.email, role: user?.role, Authorization: token },
      });
      setBranches(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFaculties = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/faculties`, {
        headers: { "X-User-Email": user?.email, role: user?.role, Authorization: token },
      });
      setFaculties(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTimetable = async (branch, semester) => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/timetable/${branch}/${semester}`,
        { headers: { "X-User-Email": user?.email, role: user?.role, Authorization: token } }
      );
      setLectures(res.data.lectures || {});
    } catch {
      setLectures({});
    }
  };

  const handleSelectChange = (e) => {
    const [branch, semester] = e.target.value.split("|");
    setSelected({ branch, semester });
    fetchTimetable(branch, semester);
  };

  const handleLectureChange = (day, value) => {
    setLectures((prev) => ({ ...prev, [day]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/timetable`,
        { branchCode: selected.branch, semester: selected.semester, lectures },
        { headers: { "X-User-Email": user?.email, role: user?.role, Authorization: token } }
      );
      alert("Timetable saved!");
      fetchBranches();
    } catch (err) {
      alert("Error saving timetable");
    }
  };

  const generateLiveQr = () => {
    if (liveLecture) {
      setQrCode(`${liveLecture.branch}|${liveLecture.semester}|${Date.now()}`);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Timetable</h1>

      {adminView && (
        <div className="admin-form bg-white shadow p-4 mb-6">
          <select onChange={handleSelectChange} value={`${selected.branch}|${selected.semester}`}>
            <option value="">-- Select Branch & Semester --</option>
            {branches.map((b, idx) => (
              <option key={idx} value={`${b.branchCode}|${b.semester}`}>
                {b.branchCode} - Semester {b.semester}
              </option>
            ))}
          </select>

          {selected.branch && (
            <form onSubmit={handleSubmit} className="mt-4">
              {days.map((day) => (
                <div key={day} className="mb-2">
                  <label className="font-semibold">{day}:</label>
                  <input
                    type="text"
                    placeholder="Subject"
                    value={lectures[day] || ""}
                    onChange={(e) => handleLectureChange(day, e.target.value)}
                    className="border p-1 ml-2"
                  />
                </div>
              ))}
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded mt-2">
                Save Timetable
              </button>
            </form>
          )}
        </div>
      )}

      <div className="timetable-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map((b, idx) => (
          <div key={idx} className="border p-4 rounded shadow">
            <h3 className="font-bold">
              {b.branchCode} - Semester {b.semester}
            </h3>
            {days.map((day) => (
              <p key={day}>
                <b>{day}:</b> {b.lectures?.[day] || "N/A"}{" "}
                {liveLecture?.day === day && <span className="text-red-600">Live</span>}
              </p>
            ))}
            {liveLecture && liveLecture.branch === b.branchCode && liveLecture.semester === b.semester && (
              <div className="mt-2">
                <QRCode value={qrCode} size={100} />
                <p className="text-sm">Scan to join live lecture</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimetableSimple;
