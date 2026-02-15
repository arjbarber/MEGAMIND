import { useState } from "react";
import { useNavigate } from "react-router-dom";

const CAROLINA_BLUE = "#7BAFD4";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [name, setName] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const endpoint = isLogin ? "/login" : "/register";
    const body = isLogin 
      ? { email, password } 
      : { email, password, birthdate, name };

    try {
      const response = await fetch(`http://34.236.152.229${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      if (isLogin) {
        localStorage.setItem("user_id", data.user_id);
        localStorage.setItem("access_token", data.access_token);
        navigate("/");
      } else {
        setIsVerifying(true);
        setError("Please check your email for a verification code.");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const response = await fetch(`http://34.236.152.229/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: verificationCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Verification failed");
      }

      setIsVerifying(false);
      setIsLogin(true);
      setError("Email verified! You can now sign in.");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={authBoxStyle}>
        <h2 style={titleStyle}>
          {isVerifying ? "VERIFY EMAIL" : isLogin ? "SIGN IN" : "CREATE ACCOUNT"}
        </h2>
        {error && <p style={{ color: error.includes("verified") ? CAROLINA_BLUE : "#f44", fontSize: "0.9rem" }}>{error}</p>}
        
        {isVerifying ? (
          <form onSubmit={handleVerify} style={formStyle}>
            <p style={{ color: "#667", fontSize: "0.8rem", textAlign: "center" }}>
              ENTER THE 6-DIGIT CODE SENT TO {email.toUpperCase()}
            </p>
            <input 
              type="text" 
              placeholder="VERIFICATION CODE" 
              value={verificationCode} 
              onChange={(e) => setVerificationCode(e.target.value)} 
              style={inputStyle}
              required
            />
            <button type="submit" style={buttonStyle}>
              VERIFY
            </button>
            <p 
              onClick={() => setIsVerifying(false)} 
              style={toggleStyle}
            >
              BACK TO LOGIN
            </p>
          </form>
        ) : (
          <form onSubmit={handleSubmit} style={formStyle}>
            {!isLogin && (
              <>
                <input 
                  type="text" 
                  placeholder="FULL NAME" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  style={inputStyle}
                  required
                />
                <input 
                  type="date" 
                  placeholder="BIRTHDATE" 
                  value={birthdate} 
                  onChange={(e) => setBirthdate(e.target.value)} 
                  style={inputStyle}
                  required
                />
              </>
            )}
            <input 
              type="email" 
              placeholder="EMAIL" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              style={inputStyle}
              required
            />
            <input 
              type="password" 
              placeholder="PASSWORD" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              style={inputStyle}
              required
            />
            
            <button type="submit" style={buttonStyle}>
              {isLogin ? "PROCEED" : "REGISTER"}
            </button>
          </form>
        )}

        {!isVerifying && (
          <p 
            onClick={() => setIsLogin(!isLogin)} 
            style={toggleStyle}
          >
            {isLogin ? "NEED AN ACCOUNT? REGISTER" : "ALREADY HAVE AN ACCOUNT? SIGN IN"}
          </p>
        )}

        <button 
          onClick={() => navigate("/")} 
          style={{ ...buttonStyle, marginTop: "1rem", borderColor: "#334", color: "#667" }}
        >
          BACK TO HUB
        </button>
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
  width: "100vw",
  background: "#000",
  fontFamily: '"Courier New", Courier, monospace',
};

const authBoxStyle: React.CSSProperties = {
  width: "400px",
  padding: "3rem",
  background: "#050507",
  border: `1px solid rgba(123, 175, 212, 0.2)`,
  display: "flex",
  flexDirection: "column",
  gap: "1.5rem",
};

const titleStyle: React.CSSProperties = {
  color: CAROLINA_BLUE,
  fontSize: "1.8rem",
  letterSpacing: "5px",
  textAlign: "center",
  margin: "0 0 1rem 0",
};

const formStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
};

const inputStyle: React.CSSProperties = {
  padding: "1rem",
  background: "#0a0a0c",
  border: "1px solid #1a1a1c",
  color: CAROLINA_BLUE,
  fontSize: "1rem",
  outline: "none",
  fontFamily: "inherit",
};

const buttonStyle: React.CSSProperties = {
  padding: "1rem",
  background: "transparent",
  border: `1px solid ${CAROLINA_BLUE}`,
  color: CAROLINA_BLUE,
  fontSize: "1.1rem",
  cursor: "pointer",
  letterSpacing: "3px",
  transition: "all 0.2s ease",
};

const toggleStyle: React.CSSProperties = {
  color: "#556",
  fontSize: "0.8rem",
  textAlign: "center",
  cursor: "pointer",
  marginTop: "1rem",
  letterSpacing: "1px",
};
