import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Prefrontal() {
  const navigate = useNavigate();
  const [completed, setCompleted] = useState(false);

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        background: "#020617",
        color: "white",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center"
      }}
    >
      {!completed ? (
        <>
          <h1>Prefrontal Cortex Puzzle</h1>
          <button onClick={() => setCompleted(true)}>
            Complete Puzzle
          </button>
        </>
      ) : (
        <>
          <h1>Puzzle Complete</h1>
          <button onClick={() => navigate("/")}>
            Return to Brain
          </button>
        </>
      )}
    </div>
  );
}
