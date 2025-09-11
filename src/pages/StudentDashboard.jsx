// src/pages/StudentDashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import QRScanner from "../components/QRScanner";
import TimetableCard from "../components/TimetableCard";
import { AnimatePresence } from "framer-motion";
import Confetti from "react-dom-confetti";
import axios from "axios";
import "../styles/stud.css";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [activeLecture, setActiveLecture] = useState(null);
  const [confetti, setConfetti] = useState(false);
  const [liveLecture, setLiveLecture] = useState(null);

  const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL;
  const normalize = (str) => (str || "").toString().trim().toLowerCase();

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user"));
    if (!u || u.role !== "student") {
      navigate("/login");
      return;
    }

    const safeUser = {
      ...u,
      branchCode: u.branchCode || u.extra_info?.branch || "",
      sem: u.sem || u.extra_info?.sem || "",
      email: u.email,
      name: u.name,
    };

    setUser(safeUser);

    if (safeUser.email) fetchAttendance(safeUser.email);
    if (safeUser.branchCode && safeUser.sem) {
      fetchTimetable(safeUser.branchCode, safeUser.sem);
      fetchLiveLecture(safeUser.branchCode, safeUser.sem);
    }
  }, [navigate]);

  // fetch all timetable (admin uploaded)
  const fetchTimetable = async (branch, sem) => {
    try {
      const res = await axios.get(`${BACKEND_BASE}/api/timetables`);
      const allTimetables = res.data || [];

      const studentLectures = [];
      allTimetables.forEach((t) => {
        if (
          normalize(t.branchCode) === normalize(branch) &&
          normalize(t.semester) === normalize(sem)
        ) {
          Object.entries(t.lectures || {}).forEach(([day, slots]) => {
            Object.entries(slots).forEach(([slot, lecture]) => {
              if (!lecture) return;
              studentLectures.push({
                id: `${branch}-${sem}-${day}-${slot}`,
                branchCode: t.branchCode,
                semester: t.semester,
                day,
                slot,
                ...lecture,
                isLive: lecture.isLive || false,
              });
            });
          });
        }
      });
      setTimetable(studentLectures);
    } catch (err) {
      console.error("❌ Error fetching timetable:", err);
    }
  };

  // fetch live lecture (specific branch+sem)
  const fetchLiveLecture = async (branch, sem) => {
    try {
      const res = await axios.get(
        `${BACKEND_BASE}/api/timetable/${branch}/${sem}/live`
      );
      if (res.data && Object.keys(res.data).length > 0) {
        setLiveLecture(res.data);
      } else {
        setLiveLecture(null);
      }
    } catch (err) {
      console.error("❌ Error fetching live lecture:", err);
    }
  };

  // fetch attendance for logged student
  const fetchAttendance = async (studentEmail) => {
    try {
      const res = await axios.get(`${BACKEND_BASE}/api/attendance/${studentEmail}`);
      setAttendance(res.data || []);
    } catch (err) {
      console.error("❌ Error fetching attendance:", err);
    }
  };

  // when student joins lecture
  const handleJoinSession = (lecture) => {
    if (
      liveLecture &&
      normalize(liveLecture.subject) === normalize(lecture.subject)
    ) {
      setActiveLecture(lecture);
    } else {
      createNotification("This session is not live right now", "error");
    }
  };

  // on QR scan success
  const handleScanSuccess = async (rawData) => {
    if (!user) return;
    try {
      const record = await axios.post(
        `${BACKEND_BASE}/api/attendance/scan`,
        { qrValue: rawData },
        {
          headers: {
            "X-User-Email": user.email,
          },
        }
      );

      if (record.data.message?.includes("marked")) {
        setConfetti(true);
        setTimeout(() => setConfetti(false), 3000);
        fetchAttendance(user.email);
        createNotification("Attendance marked successfully ✅", "success");
        setActiveLecture(null);
      } else {
        createNotification(record.data.message || "Scan failed", "error");
      }
    } catch (error) {
      console.error("❌ QR Scan error:", error);
      createNotification("Invalid QR or expired session", "error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const createNotification = (message, type) => {
    const notification = document.createElement("div");
    notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg font-medium text-white ${
      type === "success" ? "bg-green-500" : "bg-red-500"
    } animate-fade-in`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.classList.remove("animate-fade-in");
      notification.classList.add("animate-fade-out");
      setTimeout(() => {
        if (document.body.contains(notification))
          document.body.removeChild(notification);
      }, 500);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-indigo-800">
          Welcome, {user?.name}
        </h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      <h2 className="text-xl font-semibold mb-4">Your Timetable</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {timetable.map((lecture) => (
          <TimetableCard
            key={lecture.id}
            lecture={lecture}
            onJoin={handleJoinSession}
          />
        ))}
      </div>

      {activeLecture && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
            <h3 className="text-lg font-bold mb-4">
              Join Session: {activeLecture.subject}
            </h3>
            <QRScanner onScanSuccess={handleScanSuccess} />
            <button
              onClick={() => setActiveLecture(null)}
              className="mt-4 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <h2 className="text-xl font-semibold mt-8 mb-4">Your Attendance</h2>
      <ul className="bg-white shadow rounded p-4 space-y-2">
        {attendance.map((a, idx) => (
          <li key={idx} className="border-b pb-2">
            <strong>{a.sessionId}</strong> —{" "}
            {new Date(a.timestamp).toLocaleString()}
          </li>
        ))}
      </ul>

      <AnimatePresence>
        <Confetti active={confetti} />
      </AnimatePresence>
    </div>
  );
};

export default StudentDashboard;
