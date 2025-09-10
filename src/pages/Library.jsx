// src/pages/Library.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LibraryBookCard from "../components/LibraryBookCard";

const sampleBooks = [
  { id: 1, title: "Clean Code", author: "Robert C. Martin", available: true },
  { id: 2, title: "Introduction to Algorithms", author: "Cormen et al.", available: false },
  { id: 3, title: "JavaScript: The Good Parts", author: "Douglas Crockford", available: true },
  { id: 4, title: "Operating System Concepts", author: "Silberschatz", available: true },
];

const Library = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [books, setBooks] = useState(sampleBooks);
  const [borrowed, setBorrowed] = useState([]);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user"));
    if (!u) {
      navigate("/login");
    } else {
      setUser(u);
    }
  }, [navigate]);

  const handleBorrow = (bookId) => {
    const book = books.find((b) => b.id === bookId);
    if (!book) return;

    // Mark as borrowed
    setBooks((prev) =>
      prev.map((b) =>
        b.id === bookId ? { ...b, available: false } : b
      )
    );

    // Save borrow record
    const record = {
      bookId,
      title: book.title,
      studentId: user.id,
      studentName: user.name,
      borrowedAt: new Date().toLocaleString(),
    };

    setBorrowed((prev) => [...prev, record]);
    alert(`You borrowed "${book.title}"`);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Library {user && `- ${user.name}`}
        </h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      <h2 className="text-xl font-semibold mb-4">Available Books</h2>
      <div className="flex flex-wrap">
        {books.map((book) => (
          <LibraryBookCard key={book.id} book={book} onBorrow={handleBorrow} />
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Borrowed Books</h2>
        {borrowed.length === 0 ? (
          <p>No books borrowed yet.</p>
        ) : (
          <table className="w-full border border-gray-300 bg-white rounded-lg shadow-md">
            <thead>
              <tr className="bg-gray-200 text-left">
                <th className="p-2 border">Book Title</th>
                <th className="p-2 border">Borrowed At</th>
              </tr>
            </thead>
            <tbody>
              {borrowed.map((record, idx) => (
                <tr key={idx}>
                  <td className="p-2 border">{record.title}</td>
                  <td className="p-2 border">{record.borrowedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Library;
