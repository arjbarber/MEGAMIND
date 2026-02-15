import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { increaseStreak } from "../api";

export default function Prefrontal() {
  const navigate = useNavigate();
  const PREFRONTAL_BLUE = "#00b7cb"; // Your specific blue anchor

  const [num1, setNum1] = useState<number>(0);
  const [num2, setNum2] = useState<number>(0);
  const [operator, setOperator] = useState<"+" | "-">("+");
  const [answer, setAnswer] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [score, setScore] = useState<number>(0);
  const [hasIncreasedStreak, setHasIncreasedStreak] = useState(false);

  const TARGET_SCORE = 5;

  const generateProblem = () => {
    const op: "+" | "-" = Math.random() > 0.5 ? "+" : "-";
    const a = Math.floor(Math.random() * 20) + 1;
    const b = Math.floor(Math.random() * 20) + 1;

    if (op === "-" && b > a) {
      setNum1(b);
      setNum2(a);
    } else {
      setNum1(a);
      setNum2(b);
    }

    setOperator(op);
    setAnswer("");
    setMessage("");
  };

  const calculateCorrectAnswer = () => {
    return operator === "+" ? num1 + num2 : num1 - num2;
  };

  const handleSubmit = () => {
    if (Number(answer) === calculateCorrectAnswer()) {
      setScore((prev) => prev + 1);
      setMessage("Correct! ✔");
      setTimeout(() => {
        generateProblem();
      }, 1200);
    } else {
      setMessage("Try again.");
    }
  };

  useEffect(() => {
    generateProblem();
  }, []);

  useEffect(() => {
    if (score >= TARGET_SCORE && !hasIncreasedStreak) {
      increaseStreak("prefrontal");
      setHasIncreasedStreak(true);
    }
  }, [score, hasIncreasedStreak]);

  const isComplete = score >= TARGET_SCORE;

  return (
    <div style={containerStyle}>
      {/* 🔵 Persistent Navigation Bar */}
      <div style={{...navBarStyle, borderBottom: `1px solid ${PREFRONTAL_BLUE}33`}}>
        <button onClick={() => navigate("/")} style={{...backButtonStyle, color: PREFRONTAL_BLUE, borderColor: PREFRONTAL_BLUE}}>
          ← BACK TO BRAIN
        </button>
      </div>

      <div style={contentStyle}>
        <h1 style={{ fontSize: "2.5rem", color: PREFRONTAL_BLUE, letterSpacing: "4px", margin: 0 }}>
          PREFRONTAL CORTEX
        </h1>
        <p style={{ fontSize: "1.2rem", color: "#889", marginBottom: "2rem" }}>EXECUTIVE LOGIC CALIBRATION</p>

        {!isComplete ? (
          <>
            <p style={{ fontSize: "1.2rem", marginBottom: "2rem" }}>
              Solve {TARGET_SCORE} problems to activate this sector.
            </p>

            <div style={{ fontSize: "4rem", marginBottom: "2rem", fontFamily: "monospace", color: PREFRONTAL_BLUE }}>
              {num1} {operator} {num2}
            </div>

            <input
              type="number"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              autoFocus
              style={{...inputStyle, color: PREFRONTAL_BLUE, borderColor: PREFRONTAL_BLUE}}
            />

            <br />

            <button
              onClick={handleSubmit}
              style={{...noirButtonStyle, background: PREFRONTAL_BLUE}}
            >
              SUBMIT
            </button>

            <div style={{ marginTop: "2.5rem", fontSize: "1.2rem" }}>
              <p style={{ letterSpacing: "2px" }}>Score: {score} / {TARGET_SCORE}</p>
              <p style={{ color: PREFRONTAL_BLUE }}>{message}</p>
            </div>
          </>
        ) : (
          <div style={{...successOverlayStyle, borderColor: PREFRONTAL_BLUE}}>
            <h2 style={{ fontSize: "2.5rem", marginBottom: "1.5rem", color: PREFRONTAL_BLUE }}>
              SECTOR ACTIVATED ✨
            </h2>
            <p style={{ color: "#889", marginBottom: "2.5rem" }}>
              Logic circuits verified. Executive functions are stabilized.
            </p>
            <button
              onClick={() => navigate("/")}
              style={{...noirButtonStyle, background: PREFRONTAL_BLUE}}
            >
              RETURN TO BRAIN
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* --- Thematic Styles for Urban Noir --- */
const containerStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#050507",
  color: "#E6EDF3",
  display: "flex",
  flexDirection: "column",
  fontFamily: '"Courier New", monospace',
};

const navBarStyle: React.CSSProperties = {
  padding: "20px 40px",
  background: "rgba(10, 10, 12, 0.9)",
};

const backButtonStyle: React.CSSProperties = {
  background: "transparent",
  padding: "10px 20px",
  fontSize: "1rem",
  cursor: "pointer",
  letterSpacing: "2px",
  border: "1px solid"
};

const contentStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "2rem",
};

const inputStyle: React.CSSProperties = {
  fontSize: "2.5rem",
  padding: "0.5rem",
  width: "180px",
  textAlign: "center",
  background: "transparent",
  border: "2px solid",
  marginBottom: "1rem",
};

const noirButtonStyle: React.CSSProperties = {
  fontSize: "1.2rem",
  padding: "1rem 2.5rem",
  border: "none",
  color: "#000",
  fontWeight: "bold",
  cursor: "pointer",
  letterSpacing: "3px",
};

const successOverlayStyle: React.CSSProperties = {
  padding: "4rem",
  border: "2px solid",
  background: "rgba(0, 183, 203, 0.05)",
  borderRadius: "8px",
};