import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const formRef = useRef(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const loginRes = await axios.post(
        "http://localhost:5000/api/login",
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );

      if (!loginRes.data.user || !loginRes.data.token) {
        throw new Error("Invalid response from server");
      }

      localStorage.setItem("user", JSON.stringify(loginRes.data.user));
      localStorage.setItem("token", loginRes.data.token);

      const user = loginRes.data.user;
      if (user.role === "admin") navigate("/admin/dashboard");
      else if (user.role === "faculty") navigate("/faculty-dashboard");
      else navigate("/student-dashboard");
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Something went wrong"
      );

      if (formRef.current) {
        formRef.current.classList.add("shake");
        setTimeout(() => {
          if (formRef.current) formRef.current.classList.remove("shake");
        }, 500);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-form-container" ref={formRef}>
        <h1>Login to Your Account</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              disabled={isLoading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Processing..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
