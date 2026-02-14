import { Canvas } from "@react-three/fiber"
import { OrbitControls, useGLTF } from "@react-three/drei"
import { Suspense } from "react"

function BrainModel() {
  const { scene } = useGLTF("/models/brain.glb")
  return (
    <primitive
      object={scene}
      scale={4}
      position={[-1.2, 0, 0]}
    />
  )
}

export default function App() {
  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw" }}>
      
      {/* LEFT: 3D */}
      <div style={{ width: "75%", height: "100%" }}>
        <Canvas
          camera={{ position: [0, 0, 8], fov: 45 }}
          gl={{ antialias: true }}
        >
          {/* Pure neutral lighting */}
          <ambientLight intensity={1} />
          <directionalLight position={[5, 5, 5]} intensity={1} />

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
          background: "#111",
          color: "white",
          padding: "2rem",
          fontFamily: "system-ui",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center"
        }}
      >
        <h2>Brain Legend</h2>
        <p>Prefrontal Cortex</p>
        <p>Temporal Lobe</p>
        <p>Parietal Lobe</p>
        <p>Occipital Lobe</p>
      </div>

    </div>
  )
}
