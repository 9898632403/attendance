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
  const [liveSessions, setLiveSessions] = useState([]);

  const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user"));
    if (!u || u.role !== "student") {
      navigate("/login");
      return;
    }

    const safeUser = {
      ...u,
      branchCode: u.branchCode || u.branch || u.extra_info?.branch || "",
      sem: u.sem || u.semester || u.extra_info?.sem || "",
      id: u.id || u._id || u.extra_info?._id || u.userId,
    };
    setUser(safeUser);

    if (safeUser.id) fetchAttendance(safeUser.id);
    fetchTimetable(safeUser.branchCode, safeUser.sem);
    fetchLiveSessions(); // Fetch live sessions
  }, [navigate]);

  // Fetch timetable based on branch and semester
  const fetchTimetable = async (branch, sem) => {
    try {
      const res = await axios.get(`${BACKEND_BASE}/api/timetables`);
      const allTimetables = res.data || [];

      const studentLectures = [];

      allTimetables.forEach((t) => {
        // More flexible matching for branch and semester
        const branchMatch = t.branchCode && branch && 
          t.branchCode.toString().trim().toLowerCase() === branch.toString().trim().toLowerCase();
        
        const semMatch = t.semester && sem && 
          t.semester.toString().trim() === sem.toString().trim();

        if (branchMatch && semMatch) {
          const { lectures } = t;
          if (lectures && typeof lectures === "object") {
            Object.entries(lectures).forEach(([day, slots]) => {
              Object.entries(slots).forEach(([slot, lecture]) => {
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
        }
      });

      setTimetable(studentLectures);
    } catch (err) {
      console.error("Error fetching timetables:", err);
    }
  };

  // Fetch live sessions specifically
  const fetchLiveSessions = async () => {
    try {
      const res = await axios.get(`${BACKEND_BASE}/api/sessions/live`);
      setLiveSessions(res.data || []);
    } catch (err) {
      console.error("Error fetching live sessions:", err);
    }
  };

  const fetchAttendance = async (studentId) => {
    if (!studentId) return console.warn("Student ID missing, skipping attendance fetch.");
    try {
      const res = await axios.get(`${BACKEND_BASE}/api/attendance/${studentId}`);
      setAttendance(res.data || []);
    } catch (err) {
      console.error("Error fetching attendance:", err);
    }
  };

  const handleJoinSession = (lecture) => {
    // Check if this lecture is currently live
    const isCurrentlyLive = liveSessions.some(session => 
      session.subject === lecture.subject && 
      session.branchCode === lecture.branchCode
    );
    
    if (isCurrentlyLive) {
      setActiveLecture(lecture);
    } else {
      createNotification("This session is not currently active", "error");
    }
  };

  const handleScanSuccess = async (rawData) => {
    if (!user) return;
    try {
      const data = JSON.parse(rawData);
      
      // Verify the session is still valid
      const sessionRes = await axios.get(`${BACKEND_BASE}/api/sessions/validate/${data.sessionId}`);
      if (!sessionRes.data.valid) {
        createNotification("This QR code has expired", "error");
        return;
      }
      
      const record = {
        studentId: user.id,
        studentName: user.name,
        sessionId: data.sessionId,
        subject: data.subject || "Unknown",
        time: new Date().toISOString(),
      };

      setAttendance((prev) => [...prev, record]);
      await axios.post(`${BACKEND_BASE}/api/attendance`, record);

      setConfetti(true);
      setTimeout(() => setConfetti(false), 3000);
      createNotification(`Attendance marked for ${record.subject}`, "success");
      setActiveLecture(null);
    } catch (error) {
      console.error("Invalid QR code or backend error:", error);
      createNotification("Invalid QR code scanned or server error!", "error");
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
        if (document.body.contains(notification)) document.body.removeChild(notification);
      }, 500);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
      <div className="fixed top-0 left-1/2 transform -translate-x-1/2 z-50">
        <Confetti
          active={confetti}
          config={{
            spread: 90,
            startVelocity: 30,
            elementCount: 100,
            dragFriction: 0.12,
            duration: 3000,
            stagger: 3,
            width: "10px",
            height: "10px",
          }}
        />
      </div>

      <div className="flex justify-between items-center mb-8 p-4 bg-white rounded-2xl shadow-lg">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Student Dashboard</h1>
          {user && (
            <p className="text-gray-600 mt-1">
              Welcome back, {user.name}! 👋 
              {user.branchCode && user.sem && (
                <span className="ml-2 text-sm bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
                  {user.branchCode} - Sem {user.sem}
                </span>
              )}
            </p>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center"
        >
          Logout
        </button>
      </div>

      {/* Live Sessions */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Live Sessions</h2>
        {liveSessions.length === 0 ? (
          <p className="text-gray-500 italic">No live sessions at the moment</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {liveSessions.map((session) => (
              <TimetableCard
                key={session._id}
                lecture={session}
                onJoin={handleJoinSession}
                isLive={true}
              />
            ))}
          </div>
        )}
      </section>

      {/* Full Timetable Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your Timetable</h2>
        {timetable.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl shadow">
            <p className="text-gray-500">
              No timetable available for your branch/semester. 
              Please contact administration if this is incorrect.
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Your details: Branch: {user?.branchCode || "Not set"}, Semester: {user?.sem || "Not set"}
            </p>
          </div>
        ) : (
          <div>
            {/* Group by day */}
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
              const dayLectures = timetable.filter(lecture => lecture.day === day);
              if (dayLectures.length === 0) return null;
              
              return (
                <div key={day} className="mb-6">
                  <h3 className="text-xl font-medium text-gray-700 mb-3">{day}</h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {dayLectures.map((lecture) => (
                      <TimetableCard
                        key={lecture.id}
                        lecture={lecture}
                        onJoin={handleJoinSession}
                        isLive={liveSessions.some(s => s.subject === lecture.subject)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* QR Scanner Modal */}
      <AnimatePresence>
        {activeLecture && (
          <div
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
            onClick={() => setActiveLecture(null)}
          >
            <div
              className="bg-white rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Scan QR for {activeLecture.subject}</h2>
                <button 
                  onClick={() => setActiveLecture(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="border-4 border-dashed border-purple-200 rounded-xl p-2">
                <QRScanner onScanSuccess={handleScanSuccess} />
              </div>
              <p className="text-center text-gray-600 mt-4">
                Point your camera at the QR code shown by your professor
              </p>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Attendance Section */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Your Attendance</h2>
        {attendance.length === 0 ? (
          <p className="text-gray-500">No attendance records yet.</p>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {attendance.map((att, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 whitespace-nowrap">{att.subject}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{att.sessionId}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{new Date(att.time).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-out {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(10px); }
        }
        .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        .animate-fade-out { animation: fade-out 0.5s ease-in forwards; }
      `}</style>
    </div>
  );
};

export default StudentDashboard;