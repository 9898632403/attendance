// src/components/QRScanner.jsx
import { useState, useRef } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import "../styles/QRScanner.css";

const BACKEND_BASE = import.meta.env.VITE_BACKEND_URL;

const QRScanner = () => {
  const [scanResult, setScanResult] = useState("");
  const [isScanning, setIsScanning] = useState(true);
  const [cameraError, setCameraError] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const fileInputRef = useRef(null);

  // Get student email from localStorage
  const studentEmail = (() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      return u.email;
    } catch {
      return null;
    }
  })();

  // Handle live QR scanning
  const handleScan = (detectedCodes) => {
    if (detectedCodes && detectedCodes.length > 0 && isScanning) {
      const raw = detectedCodes[0].rawValue?.trim();
      if (!raw) return;

      if (!raw.includes("::")) {
        setStatusMessage("❌ Invalid QR format");
        return;
      }

      setScanResult(raw);
      verifyWithBackend(raw);

      setIsScanning(false);
      setTimeout(() => setIsScanning(true), 3000); // resume after 3s
    }
  };

  const handleError = (err) => {
    console.error("Camera error:", err);
    setCameraError(true);
    setStatusMessage("❌ Camera not accessible. Use image upload instead.");
  };

  // Verify scanned QR with backend
  const verifyWithBackend = async (qrValue) => {
    if (!studentEmail) {
      setStatusMessage("❌ Student not logged in");
      return;
    }

    setStatusMessage("Verifying...");
    try {
      const res = await fetch(`${BACKEND_BASE}/api/attendance/scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Email": studentEmail,
        },
        body: JSON.stringify({ qrValue: qrValue.trim() }),
      });

      const json = await res.json();

      if (res.status === 201) {
        setStatusMessage("✅ Attendance marked successfully");
      } else if (res.status === 200 && json.message) {
        setStatusMessage(`ℹ️ ${json.message}`);
      } else {
        setStatusMessage(`❌ ${json.error || json.message || "Verification failed"}`);
      }
    } catch (err) {
      console.error("Verify error:", err);
      setStatusMessage("❌ Network error while verifying");
    }
  };

  // Handle QR image file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = async () => {
      try {
        const { BrowserQRCodeReader } = await import("@zxing/library");
        const codeReader = new BrowserQRCodeReader();
        const result = await codeReader.decodeFromImage(img);

        if (!result?.text || !result.text.includes("::")) {
          setScanResult(result?.text || "Invalid QR");
          setStatusMessage("❌ Invalid QR image");
          return;
        }

        setScanResult(result.text);
        verifyWithBackend(result.text);
      } catch (err) {
        console.error("QR decode error:", err);
        setScanResult("Invalid QR image");
        setStatusMessage("❌ Invalid QR image");
      }
    };
  };

  return (
    <div className="qr-scanner-container">
      {!cameraError ? (
        <Scanner
          onScan={isScanning ? handleScan : undefined}
          onError={handleError}
          constraints={{ facingMode: "environment" }}
        />
      ) : (
        <div>
          <p>Camera error. Upload QR image instead:</p>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
        </div>
      )}

      {scanResult && (
        
        <div>
          <p>Scanned QR value:</p>
          <strong>{scanResult}</strong>
        </div>
      )}

      {statusMessage && <div className="status">{statusMessage}</div>}
    </div>
  );
};

export default QRScanner;