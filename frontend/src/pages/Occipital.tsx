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
  {
    name: "TwelveLabs",
    image: "/sponsors/twelvelabs.png"
  },
  {
    name: "Backboard",
    image: "/sponsors/backboard.png"
  },
  {
    name: "Valkey",
    image: "/sponsors/valkey.avif"
  },
  {
    name: "AWS",
    image: "/sponsors/aws.png"
  }
];

function shuffle(array: CardType[]) {
  return [...array].sort(() => Math.random() - 0.5);
}

export default function Occipital() {
  const navigate = useNavigate();

  const initialCards: CardType[] = shuffle(
    sponsorData.flatMap((sponsor, index) => [
      { id: index * 2, name: sponsor.name, image: sponsor.image, matched: false },
      { id: index * 2 + 1, name: sponsor.name, image: sponsor.image, matched: false }
    ])
  );

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
    setCards(initialCards);
    setFlipped([]);
    setCompleted(false);
    setHasIncreasedStreak(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0B0F14",
        color: "white",
        textAlign: "center",
        paddingTop: "2rem"
      }}
    >
      <h1>Occipital Lobe</h1>
      <p>Visual Pattern Matching</p>

      {!completed ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 150px)",
            gap: "20px",
            justifyContent: "center",
            marginTop: "3rem"
          }}
        >
          {cards.map((card, index) => {
            const isFlipped =
              flipped.includes(index) || card.matched;

            return (
              <div
                key={card.id}
                onClick={() => handleFlip(index)}
                style={{
                  width: "150px",
                  height: "150px",
                  borderRadius: "12px",
                  background: isFlipped ? "#1F2937" : "#2A2F36",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "0.3s",
                  boxShadow: isFlipped
                    ? "0 0 15px #00FF7F"
                    : "none"
                }}
              >
                {isFlipped ? (
                  <img
                    src={card.image}
                    alt={card.name}
                    style={{
                      maxWidth: "80%",
                      maxHeight: "80%"
                    }}
                  />
                ) : (
                  <span style={{ fontSize: "2rem" }}>?</span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <>
          <h2 style={{ marginTop: "3rem" }}>
            Occipital Cortex Activated 👁️✨
          </h2>

          <button
            onClick={() => navigate("/")}
            style={{
              marginTop: "2rem",
              padding: "1rem 2rem",
              fontSize: "1.2rem",
              background: "#00FF7F",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            Return to Brain
          </button>

          <button
            onClick={restart}
            style={{
              marginTop: "1rem",
              marginLeft: "1rem",
              padding: "1rem 2rem",
              fontSize: "1.2rem",
              background: "#FFD700",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            Play Again
          </button>
        </>
      )}
    </div>
  );
}
