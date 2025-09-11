import React from "react";

const TimetableCard = ({ lecture, onStart, onJoin }) => {
  if (!lecture) return null;

  // Normalize faculty display (string or object)
  const facultyName =
    typeof lecture.faculty === "object"
      ? lecture.faculty.name || "N/A"
      : lecture.faculty || "N/A";

  return (
    <div className="border p-4 rounded-lg bg-white shadow hover:shadow-lg transition">
      <h3 className="text-lg font-semibold mb-2">
        {lecture.subject || "No Subject"}
      </h3>

      <p>
        <strong>Branch:</strong> {lecture.branchCode || "N/A"} |{" "}
        <strong>Semester:</strong> {lecture.semester || "N/A"}
      </p>
      <p>
        <strong>Day:</strong> {lecture.day || "N/A"} |{" "}
        <strong>Slot:</strong> {lecture.slot || "N/A"}
      </p>
      <p>
        <strong>Faculty:</strong> {facultyName}
      </p>
      <p>
        <strong>Class:</strong> {lecture.classNo || "N/A"} |{" "}
        <strong>Location:</strong> {lecture.location || "N/A"}
      </p>
      <p>
        <strong>Time:</strong> {lecture.startTime || "N/A"} -{" "}
        {lecture.endTime || "N/A"}
      </p>

      <button
        onClick={() =>
          onJoin ? onJoin(lecture) : onStart && onStart(lecture)
        }
        className={`mt-3 px-3 py-1 rounded ${
          lecture.isLive
            ? "bg-green-500 cursor-not-allowed"
            : onStart
            ? "bg-blue-600 hover:bg-blue-700"
            : "bg-indigo-600 hover:bg-indigo-700"
        } text-white`}
        disabled={lecture.isLive && !!onStart} // only disable start for faculty
      >
        {lecture.isLive
          ? "Session Live ✅"
          : onStart
          ? "Start Session"
          : "Join Session"}
      </button>
    </div>
  );
};

export default TimetableCard;
