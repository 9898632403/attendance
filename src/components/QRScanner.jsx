import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";

const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL;

const QRScanner = ({ studentEmail }) => {
  const [scanResult, setScanResult] = useState("");
  const [message, setMessage] = useState("");

  const handleScan = async (result) => {
    if (!result) return;
    setScanResult(result?.text || result);

    try {
      const res = await fetch(`${BACKEND_BASE}/api/attendance/scan`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-User-Email": studentEmail
        },
        body: JSON.stringify({ qrValue: result?.text || result })
      });
      const json = await res.json();
      if (res.ok) setMessage(json.message || "Attendance marked");
      else setMessage(json.error || "Failed to mark attendance");
    } catch (err) {
      console.error(err);
      setMessage("Error scanning QR");
    }
  };

  return (
    <div>
      <h2>Scan QR Code</h2>
      <Scanner
        onDecode={handleScan}
        onError={(err) => console.error(err)}
        style={{ width: "300px" }}
      />
      {scanResult && <p>Last scanned: {scanResult}</p>}
      {message && <p>{message}</p>}
    </div>
  );
};

export default QRScanner;
