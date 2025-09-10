// src/components/LibraryBookCard.jsx
import React from "react";

const LibraryBookCard = ({ book, onBorrow }) => {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "16px",
        margin: "10px",
        width: "220px",
        boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
      }}
    >
      <img
        src={book.cover || "https://via.placeholder.com/150"}
        alt={book.title}
        style={{ width: "100%", height: "280px", borderRadius: "6px", objectFit: "cover" }}
      />
      <h3 style={{ marginTop: "10px" }}>{book.title}</h3>
      <p style={{ margin: "5px 0", fontWeight: "bold" }}>{book.author}</p>
      <p style={{ margin: "5px 0", fontSize: "14px", color: "#555" }}>
        {book.available ? "Available" : "Not Available"}
      </p>
      {onBorrow && book.available && (
        <button
          onClick={() => onBorrow(book.id)}
          style={{
            marginTop: "10px",
            padding: "8px 12px",
            background: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Borrow
        </button>
      )}
    </div>
  );
};

export default LibraryBookCard;
