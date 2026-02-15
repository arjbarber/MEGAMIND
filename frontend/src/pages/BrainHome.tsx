import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";

const CAROLINA_BLUE = "#7BAFD4";

/* 🧠 Brain Model – Safe + Visible */
function BrainModel({ activePart }: { activePart: string | null }) {
  const { scene } = useGLTF("/models/brain.glb");

  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;

        if (mesh.material instanceof THREE.MeshStandardMaterial) {
          mesh.material = mesh.material.clone();

          // Keep base brain visible and natural
          mesh.material.roughness = 0.6;
          mesh.material.metalness = 0.1;

          const name = mesh.name.toLowerCase();

          const matches =
            (activePart === "prefrontal" && name.includes("frontal")) ||
            (activePart === "temporal" && name.includes("temporal")) ||
            (activePart === "occipital" && name.includes("occipital")) ||
            (activePart === "cerebellum" && name.includes("cerebellum"));

          if (matches) {
            mesh.material.emissive = new THREE.Color(CAROLINA_BLUE);
            mesh.material.emissiveIntensity = 2.2;
          } else {
            // DO NOT darken base material
            mesh.material.emissive = new THREE.Color("#000000");
            mesh.material.emissiveIntensity = 0;
          }
        }
      }
    });
  }, [clonedScene, activePart]);

  return <primitive object={clonedScene} scale={3.8} />;
}


export default function BrainHome() {
  const navigate = useNavigate();
  const [activePart, setActivePart] = useState<string | null>(null);

  return (
    <div style={containerStyle}>
      {/* LEFT: 3D Workspace */}
      <div style={{ width: "70%", height: "100%", background: "#000" }}>
        <Canvas camera={{ position: [0, 2, 9], fov: 40 }}>
          
          {/* Balanced Lighting for Depth */}
          <ambientLight intensity={0.8} />
          <directionalLight position={[10, 0, 50]} intensity={1.2} />
          <directionalLight position={[10, -5, 10]} intensity={0.4} />

          <Suspense fallback={null}>
            <BrainModel activePart={activePart} />
          </Suspense>

          <OrbitControls
            enablePan={false}
            maxDistance={15}
            minDistance={6}
          />
        </Canvas>
      </div>

      {/* RIGHT: Urban Noir Legend (UNCHANGED UI) */}
      <div style={legendStyle}>
        <h2 style={titleStyle}>MEGAMIND!</h2>
        <p style={{ color: '#556', marginBottom: '2rem', fontStyle: 'italic' }}>
          Finish all 5 tests to unlock your colored brain!
        </p>

        {["Prefrontal", "Temporal", "Occipital", "Cerebellum"].map((part) => (
          <button 
            key={part}
            onMouseEnter={() => setActivePart(part.toLowerCase())}
            onMouseLeave={() => setActivePart(null)}
            onClick={() => navigate(`/${part.toLowerCase()}`)} 
            style={{
              ...buttonStyle,
              borderColor: activePart === part.toLowerCase() ? CAROLINA_BLUE : "#1a1a1c",
              color: activePart === part.toLowerCase() ? CAROLINA_BLUE : "#889"
            }}
          >
            {part.toUpperCase()}
          </button>
        ))}
        
        <div style={footerStyle}>
          <p>EST. 2026 | SECTOR: {activePart ? activePart.toUpperCase() : "STANDBY"}</p>
          <p>COORDINATION STATUS: NOMINAL</p>
        </div>
      </div>
    </div>
  );
}

/* --- Urban Noir Aesthetics (UNCHANGED) --- */
const containerStyle: React.CSSProperties = { 
  display: "flex", 
  height: "100vh", 
  width: "100vw", 
  background: "#000",
  overflow: "hidden" 
};

const legendStyle: React.CSSProperties = {
  width: "30%",
  background: "#050507",
  borderLeft: `2px solid rgba(123, 175, 212, 0.1)`,
  padding: "4rem 2rem",
  fontFamily: '"Courier New", Courier, monospace',
  display: "flex",
  flexDirection: "column",
  gap: "1.5rem"
};

const titleStyle = { 
  color: CAROLINA_BLUE, 
  fontSize: "2.4rem", 
  letterSpacing: "8px", 
  margin: "0",
  textShadow: `0 0 10px rgba(123, 175, 212, 0.3)`
};

const buttonStyle: React.CSSProperties = {
  padding: "1.4rem",
  width: "100%",
  fontSize: "1.2rem",
  background: "transparent",
  border: "1px solid #1a1a1c",
  borderRadius: "2px",
  cursor: "pointer",
  textAlign: "left",
  transition: "all 0.2s ease",
  letterSpacing: "3px"
};

const footerStyle: React.CSSProperties = {
  marginTop: "auto",
  fontSize: "0.9rem",
  color: "#334",
  letterSpacing: "2px",
  borderTop: "1px solid #111",
  paddingTop: "1.5rem",
  lineHeight: "1.8"
};
