// src/pages/FacultyDashboard.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import QRCode from "react-qr-code";
import "../styles/faculty.css";

const FacultyDashboard = () => {
  const [user, setUser] = useState(null);
  const [timetables, setTimetables] = useState([]);
  const [selected, setSelected] = useState({ branch: "", semester: "" });
  const [liveSession, setLiveSession] = useState(null);
  const [qrValue, setQrValue] = useState("");

  const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user"));
    if (!u || !["faculty", "admin"].includes(u.role)) {
      window.location.href = "/login";
      return;
    }
    setUser(u);
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const res = await axios.get(`${BACKEND_BASE}/api/timetables`, {
        headers: {
          "X-User-Email": user?.email,
          role: user?.role,
        },
      });
      setTimetables(res.data || []);
    } catch (err) {
      console.error("❌ Error fetching timetables:", err);
    }
  };

  const handleSelectChange = (e) => {
    const [branch, semester] = e.target.value.split("|");
    setSelected({ branch, semester });
  };

  const startLiveSession = async () => {
    if (!selected.branch || !selected.semester) return alert("Select branch & semester");

    try {
      const res = await axios.post(
        `${BACKEND_BASE}/api/session/create`,
        { faculty_email: user.email, meta: { branch: selected.branch, semester: selected.semester } },
        { headers: { "X-User-Email": user.email } }
      );
      setLiveSession({
        sessionId: res.data.sessionId,
        token: res.data.token,
        token_expiry: res.data.token_expiry,
      });
      setQrValue(`${res.data.sessionId}::${res.data.token}`);
      alert("Live session started!");
    } catch (err) {
      console.error("❌ Start session error:", err);
      alert("Failed to start live session");
    }
  };

  const stopLiveSession = async () => {
    if (!liveSession) return;
    try {
      await axios.patch(
        `${BACKEND_BASE}/api/timetable/${selected.branch}/${selected.semester}/reset-live`,
        {},
        { headers: { "X-User-Email": user.email, role: user.role } }
      );
      setLiveSession(null);
      setQrValue("");
      alert("Live session stopped");
    } catch (err) {
      console.error("❌ Stop session error:", err);
      alert("Failed to stop session");
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-green-50 to-teal-50">
      <h1 className="text-2xl font-bold mb-4">Welcome, {user?.name}</h1>

      <div className="mb-6">
        <label className="font-semibold mr-2">Select Branch & Semester:</label>
        <select onChange={handleSelectChange} value={`${selected.branch}|${selected.semester}`}>
          <option value="">-- Select --</option>
          {timetables.map((t, idx) => (
            <option key={idx} value={`${t.branchCode}|${t.semester}`}>
              {t.branchCode} - Semester {t.semester}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={startLiveSession}
        >
          Start Live Session
        </button>
        <button
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          onClick={stopLiveSession}
          disabled={!liveSession}
        >
          Stop Live Session
        </button>
      </div>

      {liveSession && (
        <div className="bg-white p-4 rounded shadow w-full max-w-sm">
          <h2 className="font-semibold mb-2">Live Session QR</h2>
          <QRCode value={qrValue} size={180} />
          <p className="mt-2 text-sm">
            Session ID: <strong>{liveSession.sessionId}</strong>
          </p>
          <p className="text-sm">
            Token expires: {new Date(liveSession.token_expiry).toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
};

export default FacultyDashboard;
