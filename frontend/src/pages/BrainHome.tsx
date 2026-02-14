import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { Suspense } from "react";
import { useNavigate } from "react-router-dom";

function BrainModel() {
  const { scene } = useGLTF("/models/brain.glb");
  return <primitive object={scene} scale={4} />;
}

export default function BrainHome(){
  const navigate = useNavigate();

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw" }}>
      {/* LEFT: 3D Brain */}
      <div style={{ width: "75%", height: "100%" }}>
        <Canvas camera={{ position: [0, 10, 8], fov: 45 }}>
          <ambientLight intensity={1} />
          <directionalLight position={[10, -5, 10]} intensity={1} />
          <Suspense fallback={null}>
            <BrainModel />
          </Suspense>
          <OrbitControls />
        </Canvas>
      </div>

      {/* RIGHT: Legend */}
      <div
        style={{
          width: "25%",
          background: "#000000",
          color: "white",
          padding: "2rem",
          fontFamily: "system-ui",
          display: "flex",
          flexDirection: "column",
          gap: "1rem"
        }}
      >
        <h2>Brain Legend</h2>

        <button
          onClick={() => navigate("/prefrontal")}
          style={buttonStyle}
        >
          Prefrontal Cortex
        </button>

        <button
          onClick={() => navigate("/temporal")}
          style={buttonStyle}
        >
          Temporal Lobe
        </button>

        <button
          onClick={() => navigate("/occipital")}
          style={buttonStyle}
        >
          Occipital Lobe
        </button>
      </div>
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  padding: "1rem",
  width: "100%",
  fontSize: "1rem",
  background: "#1F2937",
  color: "white",
  border: "1px solid #333",
  borderRadius: "8px",
  cursor: "pointer"
};
