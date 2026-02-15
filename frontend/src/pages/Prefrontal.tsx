import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { increaseStreak } from "../api";

export default function Prefrontal() {
  const navigate = useNavigate();

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

    // Prevent negative results
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
      increaseStreak();
      setHasIncreasedStreak(true);
    }
  }, [score, hasIncreasedStreak]);

  const isComplete = score >= TARGET_SCORE;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0B0F14",
        color: "#E6EDF3",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Avenir, system-ui",
        textAlign: "center",
        padding: "2rem"
      }}
    >
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>
        Prefrontal Cortex
      </h1>

      {!isComplete ? (
        <>
          <p style={{ fontSize: "1.2rem", marginBottom: "2rem" }}>
            Solve 5 problems to activate this region.
          </p>

          <div style={{ fontSize: "3rem", marginBottom: "2rem" }}>
            {num1} {operator} {num2}
          </div>

          <input
            type="number"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            style={{
              fontSize: "2rem",
              padding: "0.5rem",
              width: "120px",
              textAlign: "center",
              marginBottom: "1rem"
            }}
          />

          <br />

          <button
            onClick={handleSubmit}
            style={{
              fontSize: "1.2rem",
              padding: "0.7rem 1.5rem",
              background: "#C9A227",
              border: "none",
              color: "black",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            Submit
          </button>

          <div style={{ marginTop: "1.5rem", fontSize: "1.2rem" }}>
            <p>Score: {score} / {TARGET_SCORE}</p>
            <p>{message}</p>
          </div>
        </>
      ) : (
        <>
          <h2 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
            Prefrontal Cortex Activated ✨
          </h2>

          <button
            onClick={() => navigate("/")}
            style={{
              fontSize: "1.2rem",
              padding: "0.7rem 1.5rem",
              background: "#C9A227",
              border: "none",
              color: "black",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            Return to Brain
          </button>
        </>
      )}
    </div>
  );
}
