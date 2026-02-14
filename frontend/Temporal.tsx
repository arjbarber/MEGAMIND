import { useState } from "react";
import { Link } from "react-router-dom";

export default function Temporal() {
  const MAX_LEVEL = 5;
  const gridSize = 9;

  const [sequence, setSequence] = useState<number[]>([]);
  const [userInput, setUserInput] = useState<number[]>([]);
  const [level, setLevel] = useState<number>(1);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [clickedIndex, setClickedIndex] = useState<number | null>(null);
  const [message, setMessage] = useState<string>("Click Start to Begin");

  const generateNext = () => {
    if (level > MAX_LEVEL) return;

    const next = Math.floor(Math.random() * gridSize);
    const newSequence = [...sequence, next];
    setSequence(newSequence);
    setUserInput([]);
    playSequence(newSequence);
  };

  const playSequence = async (seq: number[]) => {
    setMessage("Watch Carefully");

    for (let i = 0; i < seq.length; i++) {
      setActiveIndex(seq[i]);
      await new Promise((r) => setTimeout(r, 900));
      setActiveIndex(null);
      await new Promise((r) => setTimeout(r, 400));
    }

    setMessage("Now Your Turn");
  };

  const handleClick = (index: number) => {
    if (activeIndex !== null || level > MAX_LEVEL) return;

    setClickedIndex(index);
    setTimeout(() => setClickedIndex(null), 300);

    const newInput = [...userInput, index];
    setUserInput(newInput);

    if (sequence[newInput.length - 1] !== index) {
      setMessage("Not quite right. Starting over.");
      setSequence([]);
      setLevel(1);
      setUserInput([]);
      return;
    }

    if (newInput.length === sequence.length) {
      if (level === MAX_LEVEL) {
        setMessage("Temporal Lobe Activated ✨");
        return;
      }

      setLevel((prev) => prev + 1);
      setMessage("Great job! Next level.");
      setTimeout(() => generateNext(), 1200);
    }
  };

  const startGame = () => {
    setSequence([]);
    setLevel(1);
    setUserInput([]);
    setMessage("Watch Carefully");
    setTimeout(() => generateNext(), 600);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0B0F14",
        color: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "3rem",
        fontFamily: "system-ui",
        textAlign: "center"
      }}
    >
      <h1 style={{ fontSize: "2.5rem" }}>Temporal Lobe</h1>
      <p style={{ fontSize: "1.2rem" }}>Memory Pattern Game</p>

      <h2 style={{ fontSize: "1.8rem" }}>Level: {level} / {MAX_LEVEL}</h2>
      <p style={{ fontSize: "1.2rem" }}>{message}</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 130px)",
          gap: "25px",
          marginTop: "2rem"
        }}
      >
        {Array.from({ length: gridSize }).map((_, i) => {
          const isActive = activeIndex === i;
          const isClicked = clickedIndex === i;

          return (
            <div
              key={i}
              onClick={() => handleClick(i)}
              style={{
                width: "130px",
                height: "130px",
                borderRadius: "16px",
                background: isActive
                  ? "#FFD700"
                  : isClicked
                  ? "#90EE90"
                  : "#2A2F36",
                cursor: "pointer",
                transition: "all 0.3s",
                boxShadow:
                  isActive || isClicked
                    ? "0 0 25px #FFD700"
                    : "none"
              }}
            />
          );
        })}
      </div>

      <button
        onClick={startGame}
        style={{
          marginTop: "2rem",
          padding: "1rem 2.5rem",
          fontSize: "1.2rem",
          borderRadius: "12px",
          border: "none",
          background: "#FFD700",
          color: "#000",
          cursor: "pointer"
        }}
      >
        Start
      </button>

      <Link to="/" style={{ marginTop: "2rem", color: "#FFD700", fontSize: "1.1rem" }}>
        ← Back to Brain
      </Link>
    </div>
  );
}
