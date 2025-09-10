// src/pages/FacultyDashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import QRGenerator from "../components/QRGenerator";
import TimetableCard from "../components/TimetableCard";
import axios from "axios";

const BACKEND_BASE = import.meta.env.VITE_BACKEND || "http://localhost:5000";

const FacultyDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [timetable, setTimetable] = useState([]);
  const [selectedLecture, setSelectedLecture] = useState(null);

  // Load user from localStorage
  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user"));
    const token = localStorage.getItem("token");

    if (!u || u.role !== "faculty") {
      navigate("/login");
    } else {
      setUser({ ...u, token });
      fetchTimetable(u.name, token, u.email, u.role);
    }
  }, [navigate]);

  const normalizeFaculty = (str) =>
    (str || "").toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");

  // Fetch all timetables and filter faculty lectures
  const fetchTimetable = async (facultyName, token, email, role) => {
    try {
      const res = await axios.get(`${BACKEND_BASE}/api/timetables`, {
        headers: { "X-User-Email": email, role: role, Authorization: token },
      });

      const allTimetables = res.data || [];
      const facultyLectures = [];
      const normalizedFacultyName = normalizeFaculty(facultyName);

      allTimetables.forEach((t) => {
        const { lectures, branchCode, semester } = t;
        if (!lectures) return;

        Object.entries(lectures).forEach(([day, slots]) => {
          Object.entries(slots).forEach(([slot, lecture]) => {
            if (!lecture) return;
            const facultyValue =
              typeof lecture.faculty === "object"
                ? lecture.faculty.name
                : lecture.faculty || "";
            const normalizedLectureFaculty = normalizeFaculty(facultyValue);

            if (normalizedLectureFaculty === normalizedFacultyName) {
              facultyLectures.push({
                id: `${branchCode}-${semester}-${day}-${slot}`,
                branchCode,
                semester,
                day,
                slot,
                ...lecture,
                isLive: lecture.isLive || false,
              });
            }
          });
        });
      });

      setTimetable(facultyLectures);
    } catch (err) {
      console.error("❌ Error fetching timetables:", err);
    }
  };

  // Start lecture session: creates backend session and updates QR
  const handleStartSession = async (lecture) => {
    if (!lecture || !lecture.id) return;

    try {
      const res = await axios.post(
        `${BACKEND_BASE}/api/session/create`,
        { sessionId: lecture.id, faculty_email: user.email, meta: { lecture } },
        { headers: { "Content-Type": "application/json" } }
      );

      if (res.status === 201 && res.data.sessionId) {
        const sessionLecture = {
          ...lecture,
          isLive: true,
          sessionId: res.data.sessionId,
        };
        const updatedTimetable = timetable.map((lec) =>
          lec.id === lecture.id ? sessionLecture : lec
        );
        setTimetable(updatedTimetable);
        setSelectedLecture(sessionLecture);
        localStorage.setItem("timetable", JSON.stringify(updatedTimetable));
      } else {
        console.error("❌ Session creation failed:", res.data);
      }
    } catch (err) {
      console.error("❌ Error creating session:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Faculty Dashboard {user && `- ${user.name}`}
        </h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      <h2 className="text-xl font-semibold mb-4">Today's Timetable</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {timetable.length > 0 ? (
          timetable.map((lecture) => (
            <TimetableCard
              key={lecture.id}
              lecture={lecture}
              onStart={handleStartSession}
            />
          ))
        ) : (
          <p className="text-gray-600">No lectures found for you today.</p>
        )}
      </div>

      {selectedLecture && user && selectedLecture.sessionId && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">
            Attendance QR for {selectedLecture.subject}
          </h2>
          <QRGenerator
            sessionId={selectedLecture.sessionId} // ✅ backend sessionId
            facultyEmail={user.email}
          />
        </div>
      )}
    </div>
  );
};

export default FacultyDashboard;
