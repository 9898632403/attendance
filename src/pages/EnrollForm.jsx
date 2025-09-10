// src/components/EnrollForm.jsx
import React, { useState } from "react";
import axios from "axios";

const EnrollForm = ({ adminEmail, user, token }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [branch, setBranch] = useState("");
  const [sem, setSem] = useState("");
  const [mobile, setMobile] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const branches = ["BBA", "B.Tech CE", "MBA"];
  const semesters = Array.from({ length: 8 }, (_, i) => i + 1);
  const subjectOptions = ["Math", "Physics", "Accounting", "AI", "ML"];

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setBranch("");
    setSem("");
    setMobile("");
    setSubjects([]);
    setRole("student");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const extraInfo =
        role === "student"
          ? { branch, sem, mobile }
          : { subjects };

      const res = await axios.post(
        "http://localhost:5000/api/enroll",
        {
          admin_email: adminEmail,
          name,
          email,
          password,
          role,
          extra_info: extraInfo,
        },
        {
          headers: {
            "Content-Type": "application/json",
            user: JSON.stringify(user),
            Authorization: token,
          },
        }
      );

      setSuccess(res.data.message || "User enrolled successfully");

      // ✅ Store student info locally for StudentDashboard
      if (role === "student" && res.data.user?._id) {
        const storedUser = {
          ...res.data.user,
          branchCode: branch,
          sem,
          id: res.data.user._id,
        };
        localStorage.setItem("user", JSON.stringify(storedUser));
      }

      resetForm();
    } catch (err) {
      console.error("Enroll error:", err.response?.data || err.message);
      setError(err.response?.data?.error || "Error enrolling user");
    }
  };

  const handleSubjectsChange = (e) => {
    const options = Array.from(e.target.selectedOptions, (opt) => opt.value);
    setSubjects(options);
  };

  return (
    <div className="enroll-form bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Enroll New User</h2>

      {success && <p className="text-green-600 mb-2">{success}</p>}
      {error && <p className="text-red-600 mb-2">{error}</p>}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          required
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="student">Student</option>
          <option value="faculty">Faculty</option>
        </select>

        {role === "student" && (
          <>
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              required
            >
              <option value="">Select Branch</option>
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            <select
              value={sem}
              onChange={(e) => setSem(e.target.value)}
              required
            >
              <option value="">Select Semester</option>
              {semesters.map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>

            <input
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="Mobile Number"
              required
            />
          </>
        )}

        {role === "faculty" && (
          <div>
            <label className="block font-medium mb-1">
              Select Subjects (Ctrl+Click for multiple)
            </label>
            <select
              multiple
              value={subjects}
              onChange={handleSubjectsChange}
              className="w-full border rounded p-2"
              required
            >
              {subjectOptions.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Enroll {role.charAt(0).toUpperCase() + role.slice(1)}
        </button>
      </form>
    </div>
  );
};

export default EnrollForm;
