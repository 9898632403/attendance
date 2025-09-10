import { useState, useEffect, useRef } from "react";
import QRCode from "react-qr-code";
import "../styles/QRGenerator.css";

const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL;

const QRGenerator = ({ facultyEmail }) => {
  const [qrValue, setQrValue] = useState("");
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
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
        setLoading(false);
      } else {
        console.error("Session creation failed:", json);
      }
    } catch (err) {
      console.error("Session creation error:", err);
    }
  };

  // Fetch a new short-lived token
  const fetchToken = async (sId) => {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/session/${sId}/token`, {
        method: "GET",
        headers: { "Content-Type": "application/json", "X-User-Email": facultyEmail },
      });
      const json = await res.json();
      if (res.ok && json.token) {
        setQrValue(`${sId}::${json.token}`);
        setLoading(false);
      } else {
        console.error("Token fetch error:", json);
      }
    } catch (err) {
      console.error("Token fetch failed:", err);
    }
  };

  // Initialize session and polling
  useEffect(() => {
    if (!facultyEmail) return;

    const init = async () => {
      if (!sessionId) await createSession();

      // Polling every 7 seconds for new token (5–10s range)
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
      {loading ? <p>Generating QR...</p> : <QRCode value={qrValue} size={200} />}
      <p className="hint">QR refreshes every 5–10 seconds. Screenshots will not work.</p>
    </div>
  );
};

export default QRGenerator;
