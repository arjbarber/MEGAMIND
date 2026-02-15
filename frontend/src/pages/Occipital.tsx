import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { increaseStreak } from "../api";

type CardType = {
  id: number;
  name: string;
  image: string;
  matched: boolean;
};

const sponsorData = [
  { name: "TwelveLabs", image: "/sponsors/twelvelabs.png" },
  { name: "Backboard", image: "/sponsors/backboard.png" },
  { name: "Valkey", image: "/sponsors/valkey.avif" },
  { name: "AWS", image: "/sponsors/aws.png" }
];

function shuffle(array: CardType[]) {
  return [...array].sort(() => Math.random() - 0.5);
}

export default function Occipital() {
  const navigate = useNavigate();
  const OCCIPITAL_ORANGE = "#FF8A00"; // Theme color

  // Memoize initial cards to prevent reshuffle on every re-render
  const [initialCards] = useState(() => shuffle(
    sponsorData.flatMap((sponsor, index) => [
      { id: index * 2, name: sponsor.name, image: sponsor.image, matched: false },
      { id: index * 2 + 1, name: sponsor.name, image: sponsor.image, matched: false }
    ])
  ));

  const [cards, setCards] = useState<CardType[]>(initialCards);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [completed, setCompleted] = useState(false);
  const [hasIncreasedStreak, setHasIncreasedStreak] = useState(false);

  const handleFlip = (index: number) => {
    if (flipped.length === 2 || flipped.includes(index) || cards[index].matched)
      return;

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;

      if (cards[first].name === cards[second].name) {
        const updatedCards = cards.map((card, i) =>
          i === first || i === second ? { ...card, matched: true } : card
        );
        setCards(updatedCards);
        setFlipped([]);

        if (updatedCards.every((card) => card.matched)) {
          setCompleted(true);
        }
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  useEffect(() => {
    if (completed && !hasIncreasedStreak) {
      increaseStreak("occipital");
      setHasIncreasedStreak(true);
    }
  }, [completed, hasIncreasedStreak]);

  const restart = () => {
    setCards(shuffle(initialCards.map(c => ({ ...c, matched: false }))));
    setFlipped([]);
    setCompleted(false);
    setHasIncreasedStreak(false);
  };

  return (
    <div style={containerStyle}>
      {/* 🟠 Persistent Navigation Bar */}
      <div style={{...navBarStyle, borderBottom: `1px solid ${OCCIPITAL_ORANGE}33`}}>
        <button onClick={() => navigate("/")} style={{...backButtonStyle, color: OCCIPITAL_ORANGE, borderColor: OCCIPITAL_ORANGE}}>
          ← BACK TO BRAIN
        </button>
      </div>

      <div style={contentStyle}>
        <h1 style={{ fontSize: "2.5rem", color: OCCIPITAL_ORANGE, letterSpacing: "4px", margin: 0 }}>
          OCCIPITAL LOBE
        </h1>
        <p style={{ fontSize: "1.2rem", color: "#889", marginBottom: "2rem" }}>VISUAL PATTERN MATCHING</p>

        {!completed ? (
          <div style={gridStyle}>
            {cards.map((card, index) => {
              const isFlipped = flipped.includes(index) || card.matched;

              return (
                <div
                  key={card.id}
                  onClick={() => handleFlip(index)}
                  style={{
                    ...cardStyle,
                    background: isFlipped ? "#1a1a1c" : "#0a0a0c",
                    boxShadow: isFlipped ? `0 0 15px ${OCCIPITAL_ORANGE}` : "none",
                    borderColor: isFlipped ? OCCIPITAL_ORANGE : "#334"
                  }}
                >
                  {isFlipped ? (
                    <img src={card.image} alt={card.name} style={imgStyle} />
                  ) : (
                    <span style={{ fontSize: "2rem", color: "#334" }}>?</span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{...successOverlayStyle, borderColor: OCCIPITAL_ORANGE}}>
            <h2 style={{ fontSize: "2.5rem", marginBottom: "1.5rem", color: OCCIPITAL_ORANGE }}>
              VISUAL CORTEX SYNCED ✨
            </h2>
            <p style={{ color: "#889", marginBottom: "2.5rem" }}>
              Neural patterns verified. Posterior sector stabilized.
            </p>
            <div style={{ display: "flex", gap: "1rem" }}>
              <button onClick={() => navigate("/")} style={{...noirButtonStyle, background: OCCIPITAL_ORANGE}}>
                RETURN TO BRAIN
              </button>
              <button onClick={restart} style={{...noirButtonStyle, background: "transparent", border: `1px solid ${OCCIPITAL_ORANGE}`, color: OCCIPITAL_ORANGE}}>
                RE-TEST
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* --- Thematic Styles for Urban Noir --- */
const containerStyle: React.CSSProperties = { minHeight: "100vh", background: "#050507", color: "#E6EDF3", display: "flex", flexDirection: "column", fontFamily: '"Courier New", monospace' };
const navBarStyle: React.CSSProperties = { padding: "20px 40px", background: "rgba(10, 10, 12, 0.9)" };
const backButtonStyle: React.CSSProperties = { background: "transparent", padding: "10px 20px", fontSize: "1rem", cursor: "pointer", letterSpacing: "2px", border: "1px solid" };
const contentStyle: React.CSSProperties = { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "2rem" };
const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(4, 140px)", gap: "15px", justifyContent: "center", marginTop: "1rem" };
const cardStyle: React.CSSProperties = { width: "140px", height: "140px", borderRadius: "8px", border: "1px solid", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "0.3s" };
const imgStyle: React.CSSProperties = { maxWidth: "70%", maxHeight: "70%", filter: "grayscale(100%) brightness(1.2)" };
const noirButtonStyle: React.CSSProperties = { fontSize: "1.1rem", padding: "1rem 2rem", border: "none", color: "#000", fontWeight: "bold", cursor: "pointer", letterSpacing: "3px" };
const successOverlayStyle: React.CSSProperties = { padding: "4rem", border: "2px solid", background: "rgba(255, 138, 0, 0.05)", borderRadius: "8px" };