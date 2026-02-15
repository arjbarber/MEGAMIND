import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { increaseStreak } from "../api";

export default function Temporal() {
  const navigate = useNavigate();
  const MAX_LEVEL = 5;
  const gridSize = 9;
  const TEMPORAL_GREEN = "#04f665";

  const [sequence, setSequence] = useState<number[]>([]);
  const [userInput, setUserInput] = useState<number[]>([]);
  const [level, setLevel] = useState<number>(1);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [clickedIndex, setClickedIndex] = useState<number | null>(null);
  const [message, setMessage] = useState<string>("Click Start to Begin");
  const [hasIncreasedStreak, setHasIncreasedStreak] = useState(false);

  // Generate the next sequence step, but stop if we are past MAX_LEVEL
  const generateNext = (currentLevel: number) => {
    if (currentLevel > MAX_LEVEL) return;

    setSequence((prev) => {
      const next = Math.floor(Math.random() * gridSize);
      const newSequence = [...prev, next];
      playSequence(newSequence);
      return newSequence;
    });
    setUserInput([]);
  };

  const playSequence = async (seq: number[]) => {
    setMessage("Watch Carefully");
    for (let i = 0; i < seq.length; i++) {
      setActiveIndex(seq[i]);
      await new Promise((r) => setTimeout(r, 800));
      setActiveIndex(null);
      await new Promise((r) => setTimeout(r, 300));
    }
    setMessage("Now Your Turn");
  };

  const handleClick = (index: number) => {
    // Prevent interaction if showing sequence or if already calibrated
    if (activeIndex !== null || level > MAX_LEVEL) return;

    setClickedIndex(index);
    setTimeout(() => setClickedIndex(null), 250);

    const newInput = [...userInput, index];
    setUserInput(newInput);

    // FAILURE LOGIC: Reset to Level 1
    if (sequence[newInput.length - 1] !== index) {
      setMessage("Calibration Failed. Resetting Neurons.");
      setSequence([]);
      setLevel(1);
      setUserInput([]);
      return;
    }

    // SUCCESS LOGIC: Move forward or Complete
    if (newInput.length === sequence.length) {
      if (level === MAX_LEVEL) {
        // BREAK THE LOOP: Stop here and activate
        setMessage("Temporal Lobe Calibrated ✨");
        setLevel(6); // Set above MAX_LEVEL to show success screen
        
        if (!hasIncreasedStreak) {
          increaseStreak("temporal");
          setHasIncreasedStreak(true);
        }
      } else {
        const nextLevel = level + 1;
        setLevel(nextLevel);
        setMessage(`Success. Calibrating Level ${nextLevel}...`);
        setTimeout(() => generateNext(nextLevel), 1000);
      }
    }
  };

  const startGame = () => {
    setSequence([]);
    setLevel(1);
    setUserInput([]);
    setHasIncreasedStreak(false);
    setMessage("Initializing...");
    setTimeout(() => generateNext(1), 600);
  };

  const isComplete = level > MAX_LEVEL;

  return (
    <div style={containerStyle}>
      {/* 🟢 Persistent Navigation Bar */}
      <div style={navBarStyle}>
        <button onClick={() => navigate("/")} style={backButtonStyle}>
          ← BACK TO BRAIN
        </button>
      </div>

      <div style={contentStyle}>
        <h1 style={{ fontSize: "2.5rem", letterSpacing: "4px", margin: 0 }}>TEMPORAL LOBE</h1>
        <p style={{ fontSize: "1.2rem", color: "#889", marginBottom: "1rem" }}>AUDITORY & MEMORY SYNC</p>

        {!isComplete ? (
          <>
            <h2 style={{ fontSize: "1.8rem", color: TEMPORAL_GREEN }}>LEVEL: {level} / {MAX_LEVEL}</h2>
            <p style={{ fontSize: "1.2rem", marginBottom: "2rem", letterSpacing: "2px" }}>{message.toUpperCase()}</p>

            <div style={gridLayoutStyle}>
              {Array.from({ length: gridSize }).map((_, i) => {
                const isActive = activeIndex === i;
                const isClicked = clickedIndex === i;

                return (
                  <div
                    key={i}
                    onClick={() => handleClick(i)}
                    style={{
                      ...gridSquareStyle,
                      background: isActive || isClicked ? TEMPORAL_GREEN : "#1a1a1c",
                      boxShadow: isActive || isClicked ? `0 0 25px ${TEMPORAL_GREEN}` : "none",
                      borderColor: isActive || isClicked ? "white" : "#334"
                    }}
                  />
                );
              })}
            </div>

            <button onClick={startGame} style={noirButtonStyle}>
              {sequence.length === 0 ? "INITIATE SCAN" : "RESTART"}
            </button>
          </>
        ) : (
          <div style={successOverlayStyle}>
            <h2 style={{ fontSize: "2.5rem", marginBottom: "1.5rem" }}>
              SECTOR STABILIZED ✨
            </h2>
            <p style={{ color: "#889", marginBottom: "2.5rem", fontSize: "1.1rem" }}>
              Memory patterns verified. Temporal pathways are clear, Detective.
            </p>
            <button onClick={() => navigate("/")} style={noirButtonStyle}>
              RETURN TO BRAIN
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* --- Thematic Styles for Urban Noir --- */
const containerStyle: React.CSSProperties = { minHeight: "100vh", background: "#050507", color: "#04f665", display: "flex", flexDirection: "column", fontFamily: '"Courier New", monospace' };
const navBarStyle: React.CSSProperties = { padding: "20px 40px", borderBottom: "1px solid rgba(4, 246, 101, 0.1)", background: "rgba(10, 10, 12, 0.9)" };
const backButtonStyle: React.CSSProperties = { background: "transparent", color: "#04f665", border: "1px solid #04f665", padding: "10px 20px", cursor: "pointer", letterSpacing: "2px" };
const contentStyle: React.CSSProperties = { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "2rem" };
const gridLayoutStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(3, 110px)", gap: "15px", marginTop: "1rem" };
const gridSquareStyle: React.CSSProperties = { width: "110px", height: "110px", borderRadius: "8px", border: "1px solid #334", cursor: "pointer", transition: "all 0.2s" };
const noirButtonStyle: React.CSSProperties = { marginTop: "2.5rem", padding: "1rem 2.5rem", fontSize: "1.1rem", background: "#04f665", color: "#000", border: "none", fontWeight: "bold", cursor: "pointer", letterSpacing: "3px" };
const successOverlayStyle: React.CSSProperties = { padding: "4rem", border: "2px solid #04f665", background: "rgba(4, 246, 101, 0.05)", borderRadius: "8px", maxWidth: "600px" };