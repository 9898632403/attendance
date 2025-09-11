// src/pages/FacultyDashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import QRGenerator from "../components/QRGenerator";
import TimetableCard from "../components/TimetableCard";
import axios from "axios";

const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL;

const FacultyDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [timetable, setTimetable] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
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
      fetchStudentsAndAttendance(u.branchCode, u.semester, token, u.email, u.role);
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

  // Fetch students + attendance for faculty branch/semester
  const fetchStudentsAndAttendance = async (branch, semester, token, email, role) => {
    try {
      const [studentsRes, attendanceRes] = await Promise.all([
        axios.get(`${BACKEND_BASE}/api/students/${branch}/${semester}`, {
          headers: { "X-User-Email": email, role: role, Authorization: token },
        }),
        axios.get(`${BACKEND_BASE}/api/attendance/${branch}/${semester}`, {
          headers: { "X-User-Email": email, role: role, Authorization: token },
        }),
      ]);

      setStudents(studentsRes.data || []);
      setAttendance(attendanceRes.data || []);
    } catch (err) {
      console.error("❌ Error fetching students/attendance:", err);
    }
  };

  // Start lecture session
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

      {/* Timetable Section */}
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

      {/* QR Generator Section */}
      {selectedLecture && user && selectedLecture.sessionId && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">
            Attendance QR for {selectedLecture.subject}
          </h2>
          <QRGenerator
            sessionId={selectedLecture.sessionId}
            facultyEmail={user.email}
          />
        </div>
      )}

      {/* Students + Attendance Section */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4">
          Students in {user?.branchCode} - Semester {user?.semester}
        </h2>
        <div className="overflow-x-auto bg-white shadow rounded-lg p-4">
          {students.length > 0 ? (
            <table className="min-w-full border text-sm">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-2 border">Name</th>
                  <th className="p-2 border">Email</th>
                  <th className="p-2 border">Attendance (%)</th>
                </tr>
              </thead>
              <tbody>
                {students.map((stu) => {
                  const stuAttendance = attendance.filter(
                    (a) => a.student_email === stu.email
                  );
                  const total = stuAttendance.length;
                  const present = stuAttendance.filter((a) => a.status === "present").length;
                  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

                  return (
                    <tr key={stu.email}>
                      <td className="p-2 border">{stu.name}</td>
                      <td className="p-2 border">{stu.email}</td>
                      <td className="p-2 border">{percentage}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-600">No students enrolled.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboard;
