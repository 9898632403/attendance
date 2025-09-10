import { useState, useEffect, useRef } from "react";
import QRCode from "react-qr-code";
import "../styles/QRGenerator.css";

const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL;

const QRGenerator = ({ facultyEmail }) => {
  const [qrValue, setQrValue] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const pollingRef = useRef(null);

  // Create a new session
  const createSession = async () => {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/session/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ faculty_email: facultyEmail }),
      });
      const json = await res.json();
      if (res.ok && json.sessionId && json.token) {
        setSessionId(json.sessionId);
        setQrValue(`${json.sessionId}::${json.token}`);
      }
    } catch (err) {
      console.error("Session creation error:", err);
    }
  };

  // Fetch a new token for the session
  const fetchToken = async (sId) => {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/session/${sId}/token`, {
        method: "GET",
        headers: { "X-User-Email": facultyEmail },
      });
      const json = await res.json();
      if (res.ok && json.token) {
        setQrValue(`${sId}::${json.token}`);
      }
    } catch (err) {
      console.error("Token fetch error:", err);
    }
  };

  useEffect(() => {
    if (!facultyEmail) return;

    const init = async () => {
      if (!sessionId) await createSession();

      // Refresh token every 7 seconds (between 5–10s)
      pollingRef.current = setInterval(() => {
        if (sessionId) fetchToken(sessionId);
      }, 7000);
    };

    init();

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [facultyEmail, sessionId]);

  return (
    <div className="qr-generator-container">
      <h2>Session QR Code</h2>
      {qrValue ? <QRCode value={qrValue} size={200} /> : <p>Generating QR...</p>}
      <p className="hint">QR refreshes every 5–10 seconds. Screenshots will not work.</p>
    </div>
  );
};

export default QRGenerator;
