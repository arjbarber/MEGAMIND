import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";

/* ========================= */
/* 🎨 Region Colors         */
/* ========================= */
const COLORS: Record<string, string> = {
  prefrontal: "#00b7cb",
  temporal: "#04f665",
  occipital: "#FF3C38",
  parietal: "#fffb12",
  cerebellum: "#FF8A00",
};

/* ========================= */
/* 🧠 Brain Model Component  */
/* ========================= */
function BrainModel({
  activePart,
  completedTasks,
}: {
  activePart: string | null;
  completedTasks: string[];
}) {
  const { scene } = useGLTF("/models/brain.glb");
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  // 🔥 AUTO-CENTER THE MODEL
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(clonedScene);
    const center = new THREE.Vector3();
    box.getCenter(center);

    clonedScene.position.sub(center); // shift model so center becomes (0,0,0)
  }, [clonedScene]);

  useEffect(() => {
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;

        if (mesh.material instanceof THREE.MeshStandardMaterial) {
          mesh.material = mesh.material.clone();
          mesh.material.roughness = 0.6;
          mesh.material.metalness = 0.1;

          const name = mesh.name.toLowerCase();

          const region = Object.keys(COLORS).find((key) =>
            key === "prefrontal"
              ? name.includes("frontal")
              : name.includes(key)
          );

          if (!region) return;

          const isHovered = activePart === region;
          const isCompleted = completedTasks.includes(region);

          if (isHovered) {
            mesh.material.emissive = new THREE.Color(COLORS[region]);
            mesh.material.emissiveIntensity = 2.5;
          } else if (isCompleted) {
            mesh.material.emissive = new THREE.Color(COLORS[region]);
            mesh.material.emissiveIntensity = 1.2;
          } else {
            mesh.material.emissive = new THREE.Color("#000000");
            mesh.material.emissiveIntensity = 0;
          }
        }
      }
    });
  }, [clonedScene, activePart, completedTasks]);

  return <primitive object={clonedScene} scale={3.8} />;
}


/* ========================= */
/* 🧠 Main BrainHome        */
/* ========================= */
export default function BrainHome() {
  const navigate = useNavigate();
  const [activePart, setActivePart] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [streak, setStreak] = useState<number | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const userId = localStorage.getItem("user_id");

  // 🎵 Audio Logic: Persistent Noir Vibes
  useEffect(() => {
    const audio = new Audio("/models/pinkpanther.mp3");
    audio.loop = true;
    audio.volume = 0.15;
    audioRef.current = audio;

    const startMusic = () => {
      audio.play().catch(() => {});
      window.removeEventListener("click", startMusic);
    };
    window.addEventListener("click", startMusic);

    return () => {
      audio.pause();
    };
  }, []);

  // 📊 Database Sync
  useEffect(() => {
    if (!userId) return;
    fetch("https://megamindapi.andrewbarber.dev/get-user-stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ "user-id": userId }),
    })
      .then((res) => res.json())
      .then((data) => {
        setStreak(data.streak ?? 0);
        setUserEmail(data.email ?? null);
        setCompletedTasks(data.completed_tasks || []);
      })
      .catch(console.error);
  }, [userId]);

  const handleLogout = () => {
    localStorage.clear();
    setCompletedTasks([]);
    navigate("/");
  };

  return (
    <div style={containerStyle}>
      {/* LEFT: 3D Workspace */}
      <div style={{ width: "70%", height: "100%", background: "#000" }}>
        <Canvas camera={{ position: [0, 2, 9], fov: 40 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[10, 0, 50]} intensity={1.2} />
          <Suspense fallback={null}>
            <BrainModel activePart={activePart} completedTasks={completedTasks} />
          </Suspense>
          <OrbitControls enablePan={false} maxDistance={15} minDistance={6} />
        </Canvas>
      </div>

      {/* RIGHT: Legend/Nav */}
      <div style={legendStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={titleStyle}>MEGAMIND!</h2>
          {userId ? (
            <button onClick={handleLogout} style={logoutButtonStyle}>LOGOUT</button>
          ) : (
            <button onClick={() => navigate("/auth")} style={authButtonStyle}>SIGN IN</button>
          )}
        </div>

        {userId && userEmail && (
          <div style={statsContainerStyle}>
            <p style={{ color: "#00E5FF", margin: 0, fontSize: '0.8rem' }}>SUBJECT: {userEmail.toUpperCase()}</p>
            <p style={{ color: "#FFF", margin: "0.5rem 0", fontWeight: 'bold' }}>🔥 STREAK: {streak}</p>
            <p style={{ color: "#556", margin: 0 }}>TASKS: {completedTasks.length} / 5</p>
          </div>
        )}

        {Object.keys(COLORS).map((part) => {
          const isDone = completedTasks.includes(part);
          const isHovered = activePart === part;
          return (
            <button
              key={part}
              onMouseEnter={() => setActivePart(part)}
              onMouseLeave={() => setActivePart(null)}
              onClick={() => navigate(`/${part}`)}
              style={{
                ...buttonStyle,
                borderColor: isHovered || isDone ? COLORS[part] : "#1a1a1c",
                color: isHovered || isDone ? COLORS[part] : "#889",
                boxShadow: isHovered ? `0 0 15px ${COLORS[part]}44` : "none"
              }}
            >
              {part.toUpperCase()} {isDone && "✔"}
            </button>
          );
        })}

        <div style={footerStyle}>
          <p>SYSTEM STATUS: {activePart ? `SCANNING ${activePart.toUpperCase()}` : "NEURAL STANDBY"}</p>
        </div>
      </div>
    </div>
  );
}

/* ========================= */
/* 🎭 Styles                 */
/* ========================= */
const containerStyle: React.CSSProperties = { display: "flex", height: "100vh", width: "100vw", background: "#000", overflow: "hidden" };
const legendStyle: React.CSSProperties = { width: "30%", background: "#050507", borderLeft: "2px solid rgba(255,255,255,0.05)", padding: "4rem 2rem", fontFamily: '"Courier New", monospace', display: "flex", flexDirection: "column", gap: "1.2rem" };
const titleStyle = { color: "#00E5FF", fontSize: "4.0rem", letterSpacing: "6px", margin: 0 };
const buttonStyle: React.CSSProperties = { padding: "1.2rem", width: "100%", background: "transparent", border: "1px solid #1a1a1c", cursor: "pointer", textAlign: "left", letterSpacing: "3px", transition: "all 0.3s ease", borderRadius: '4px' };
const statsContainerStyle: React.CSSProperties = { border: "1px solid #1a1a1c", padding: "1rem", background: "rgba(0, 229, 255, 0.05)", borderRadius: '4px' };
const logoutButtonStyle: React.CSSProperties = { background: "transparent", border: "1px solid #444", color: "#666", padding: "0.4rem 0.8rem", cursor: "pointer", fontSize: '0.7rem' };
const authButtonStyle: React.CSSProperties = { background: "transparent", border: "1px solid #00E5FF", color: "#00E5FF", padding: "0.4rem 0.8rem", cursor: "pointer", fontSize: '0.7rem' };
const footerStyle: React.CSSProperties = { marginTop: "auto", fontSize: "0.7rem", color: "#334", borderTop: "1px solid #111", paddingTop: "1.5rem", letterSpacing: '2px' };