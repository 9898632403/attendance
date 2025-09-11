// src/components/Timetable.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

const Timetable = ({ adminView = false, user, token }) => {
  const [branches, setBranches] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [selected, setSelected] = useState({ branch: "", semester: "" });
  const [formData, setFormData] = useState({
    branchCode: "",
    semester: "",
    lectures: {},
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const slots = [1, 2, 3, 4, 5, 6];

  // Fetch branches & faculties on admin view
  useEffect(() => {
    if (adminView) {
      fetchBranches();
      fetchFaculties();
    }
  }, [adminView]);

  const fetchBranches = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/timetables`, {
        headers: {
          "X-User-Email": user?.email,
          role: user?.role,
          Authorization: token,
        },
      });
      setBranches(res.data || []);
    } catch (err) {
      console.error("Error fetching branches:", err);
    }
  };

  const fetchFaculties = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/faculties`, {
        headers: {
          "X-User-Email": user?.email,
          role: user?.role,
          Authorization: token,
        },
      });
      console.log("Faculties fetched:", res.data);
      setFaculties(res.data || []);
    } catch (err) {
      console.error("Error fetching faculties:", err);
    }
  };

  const fetchTimetable = async (branch, semester) => {
    if (!branch || !semester) return;
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/timetable/${encodeURIComponent(branch)}/${encodeURIComponent(semester)}`,
        {
          headers: {
            "X-User-Email": user?.email,
            role: user?.role,
            Authorization: token,
          },
        }
      );
      setFormData({
        branchCode: branch,
        semester,
        lectures: res.data.lectures || {},
      });
    } catch (err) {
      setFormData({ branchCode: branch, semester, lectures: {} });
      setError(err.response?.data?.error || "Creating new timetable");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectChange = (e) => {
    const [branch, semester] = e.target.value.split("|");
    if (!branch || !semester) {
      setSelected({ branch: "", semester: "" });
      return;
    }
    setSelected({ branch, semester });
    fetchTimetable(branch, semester);
  };

  const handleChange = (e, day, slot, field) => {
    setFormData((prev) => {
      const updatedLectures = { ...prev.lectures };
      if (!updatedLectures[day]) updatedLectures[day] = {};
      if (!updatedLectures[day][slot]) updatedLectures[day][slot] = {};

      if (field === "faculty") {
        const facultyObj = faculties.find(
          (f) => f.extra_info?.facultyCode === e.target.value
        );
        updatedLectures[day][slot][field] = facultyObj
          ? { name: facultyObj.name, facultyCode: facultyObj.extra_info.facultyCode }
          : null;
      } else {
        updatedLectures[day][slot][field] = e.target.value || "";
      }

      return { ...prev, lectures: updatedLectures };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/timetable`, formData, {
        headers: {
          "X-User-Email": user?.email,
          role: user?.role,
          Authorization: token,
        },
      });
      setSuccess("Timetable saved successfully!");
      fetchBranches();
    } catch (err) {
      setError(err.response?.data?.error || "Error saving timetable");
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Class Timetable</h1>

      {adminView && (
        <div className="admin-form bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-2">Edit Existing Timetable</h2>
          <select
            value={`${selected.branch}|${selected.semester}`}
            onChange={handleSelectChange}
            className="border p-2 rounded mb-4 w-full"
          >
            <option value="">-- Select Branch & Semester --</option>
            {branches.map((b, idx) => (
              <option key={idx} value={`${b.branchCode}|${b.semester}`}>
                {b.branchCode} - Semester {b.semester}
              </option>
            ))}
          </select>

          <form className="mt-4" onSubmit={handleSubmit}>
            <div className="flex gap-4 mb-4">
              {/* Branch */}
              <select
                value={formData.branchCode}
                onChange={(e) => setFormData({ ...formData, branchCode: e.target.value })}
                required
              >
                <option value="">Select Branch</option>
                <option value="BBA">BBA</option>
                <option value="B.Tech CE">B.Tech CE</option>
                <option value="B.Tech IT">B.Tech IT</option>
                <option value="MBA">MBA</option>
              </select>

              {/* Semester */}
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                required
              >
                <option value="">Select Semester</option>
                {[...Array(8).keys()].map((num) => (
                  <option key={num + 1} value={num + 1}>
                    Semester {num + 1}
                  </option>
                ))}
              </select>
            </div>

            <table className="w-full border-collapse border">
              <thead>
                <tr>
                  <th className="border p-2">Day</th>
                  {slots.map((slot) => (
                    <th key={slot} className="border p-2">
                      Lecture {slot}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {days.map((day) => (
                  <tr key={day}>
                    <td className="border p-2 font-semibold">{day}</td>
                    {slots.map((slot) => (
                      <td key={slot} className="border p-2">
                        <input
                          type="text"
                          placeholder="Subject / Break"
                          value={formData.lectures[day]?.[slot]?.subject || ""}
                          onChange={(e) => handleChange(e, day, slot, "subject")}
                        />

                        {/* Faculty dropdown */}
                        <select
                          value={formData.lectures[day]?.[slot]?.faculty?.facultyCode || ""}
                          onChange={(e) => handleChange(e, day, slot, "faculty")}
                        >
                          <option value="">Select Faculty</option>
                          {faculties.map((f) => (
                            <option key={f._id} value={f.extra_info?.facultyCode}>
                              {f.name} ({f.extra_info?.facultyCode})
                            </option>
                          ))}
                        </select>

                        <input
                          type="text"
                          placeholder="Class No"
                          value={formData.lectures[day]?.[slot]?.classNo || ""}
                          onChange={(e) => handleChange(e, day, slot, "classNo")}
                        />
                        <input
                          type="text"
                          placeholder="Location"
                          value={formData.lectures[day]?.[slot]?.location || ""}
                          onChange={(e) => handleChange(e, day, slot, "location")}
                        />
                        <input
                          type="time"
                          value={formData.lectures[day]?.[slot]?.startTime || ""}
                          onChange={(e) => handleChange(e, day, slot, "startTime")}
                        />
                        <input
                          type="time"
                          value={formData.lectures[day]?.[slot]?.endTime || ""}
                          onChange={(e) => handleChange(e, day, slot, "endTime")}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {error && <p className="text-red-600 mt-2">{error}</p>}
            {success && <p className="text-green-600 mt-2">{success}</p>}

            <button type="submit" className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">
              {selected.branch ? "Update Timetable" : "Save Timetable"}
            </button>
          </form>
        </div>
      )}

      {/* Display all timetables */}
      <div className="timetable-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {branches.length === 0 ? (
          <p>No timetable entries available</p>
        ) : (
          branches.map((b, idx) => (
            <div key={idx} className="border p-4 rounded shadow">
              <h3 className="font-bold">
                {b.branchCode} - Semester {b.semester}
              </h3>
              {b.lectures && typeof b.lectures === "object" ? (
                Object.entries(b.lectures).map(([day, slots]) => (
                  <div key={day} className="mt-2">
                    <h4 className="font-semibold">{day}</h4>
                    {Object.entries(slots).map(([slot, data]) => (
                      <p key={slot}>
                        <b>Lecture {slot}:</b> {data.subject || "N/A"} (
                        {data.faculty?.name || "N/A"})
                        <br />
                        {data.classNo || "N/A"}, {data.location || "N/A"} <br />
                        {data.startTime || "?"} - {data.endTime || "?"}
                      </p>
                    ))}
                  </div>
                ))
              ) : (
                <p>No lectures available</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Timetable;
