import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { increaseStreak } from "../api";

const SOCKET_URL = "https://megamindapi.andrewbarber.dev";

export default function Parietal() {
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [completedShapes, setCompletedShapes] = useState<string[]>([]);
  const [message, setMessage] = useState<string>("Initializing camera...");
  const [isTaskComplete, setIsTaskComplete] = useState<boolean>(false);
  const [hasIncreasedStreak, setHasIncreasedStreak] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const completedShapesRef = useRef<string[]>([]);
  const isProcessingRef = useRef<boolean>(false);

  // Initialize Socket
  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to backend");
      setMessage("Connected. Draw the shapes!");
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Socket Event Listeners
  useEffect(() => {
    if (!socket) return;

    socket.on("frame_result", (data) => {
      // Always update the image feed
      setProcessedImage(data.image);

      const shapeName = data.shape_name;
      const status = data.status;

      // Deduplication Logic
      if (completedShapesRef.current.includes(shapeName) && status !== 'completed') {
          socket.emit("reset_game", { user_id: "anonymous" });
          setMessage(`Skipping ${shapeName} (already done)...`);
          return;
      }

      if (status === "completed") {
        if (!completedShapesRef.current.includes(shapeName)) {
          const newCompleted = [...completedShapesRef.current, shapeName];
          completedShapesRef.current = newCompleted;
          setCompletedShapes(newCompleted);

          if (newCompleted.length >= 3) {
            setIsTaskComplete(true);
            setMessage("Parietal Lobe Activated! All shapes completed.");
          } else {
            setMessage(`Correct! You drew a ${shapeName}. fetching next...`);
            // Reset after a short delay to show the success message
            setTimeout(() => {
              socket.emit("reset_game", { user_id: "anonymous" });
            }, 1500);
          }
        }
      } else if (!isTaskComplete) {
         if (!completedShapesRef.current.includes(shapeName)) {
             setMessage(`Draw a ${shapeName} (${completedShapesRef.current.length}/3)`);
         }
      }
    });

    socket.on("status_update", (data) => {
      console.log("Status update:", data.message);
    });

    return () => {
      socket.off("frame_result");
      socket.off("status_update");
    };
  }, [socket, isTaskComplete]);

  useEffect(() => {
    if (isTaskComplete && !hasIncreasedStreak) {
      increaseStreak("parietal");
      setHasIncreasedStreak(true);
    }
  }, [isTaskComplete, hasIncreasedStreak]);

  // Camera & Frame Loop
  useEffect(() => {
    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
        setMessage("Error: Webcam access denied.");
      }
    };

    startVideo();

    const interval = setInterval(() => {
        // 1. Check if we are already waiting on a frame or if task is done
        if (!socket || !videoRef.current || !canvasRef.current || isTaskComplete || isProcessingRef.current) return;
        
        if (videoRef.current.readyState !== 4) return;
        if (completedShapesRef.current.length >= 3) return;

        const context = canvasRef.current.getContext("2d");
        if (context) {
            context.drawImage(videoRef.current, 0, 0, 640, 480);
            const imageData = canvasRef.current.toDataURL("image/jpeg", 0.6);

            // 2. Set the lock to true
            isProcessingRef.current = true;

            // 3. Emit the frame with a callback (acknowledgment)
            socket.emit("process_frame", { image: imageData, user_id: "anonymous" }, () => {
            // 4. Release the lock when the server confirms receipt/processing
            isProcessingRef.current = false;
            });
        }
    }, 100);

    return () => {
      clearInterval(interval);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [socket, isTaskComplete]);

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
        Parietal Lobe
      </h1>

      {!isTaskComplete ? (
        <>
          <p style={{ fontSize: "1.2rem", marginBottom: "1.5rem" }}>
            Spatial Awareness: Trace 3 different shapes with your index finger.
          </p>
          
          <div style={{ position: "relative", width: "640px", height: "480px", background: "#111", borderRadius: "12px", overflow: "hidden", border: "2px solid #333" }}>
            
            {/* FIX 2: Replaced display: "none" with position absolute and opacity 0 */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
              width="640"
              height="480"
            />
            
            {/* Hidden canvas for extraction */}
            <canvas 
              ref={canvasRef} 
              width="640" 
              height="480" 
              style={{ display: "none" }} 
            />

            {/* Display the processed image from server */}
            {processedImage ? (
                <img 
                    src={processedImage} 
                    alt="Processed Game Feed" 
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
            ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                    <p>Loading Camera...</p>
                </div>
            )}
          </div>

          <div style={{ marginTop: "1.5rem", fontSize: "1.5rem" }}>
             <p>{message}</p>
          </div>

          <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
            {completedShapes.map((shape, idx) => (
                <span key={idx} style={{ 
                    padding: "0.5rem 1rem", 
                    background: "#238636", 
                    borderRadius: "20px", 
                    fontSize: "0.9rem",
                    fontWeight: "bold"
                }}>
                    {shape}
                </span>
            ))}
          </div>
        </>
      ) : (
        <>
          <h2 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
            Parietal Lobe Activated
          </h2>
          <div style={{ marginBottom: "2rem" }}>
            <p style={{ fontSize: "1.2rem" }}>Completed Shapes:</p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "1rem" }}>
                {completedShapes.map((shape, idx) => (
                    <span key={idx} style={{ 
                        padding: "0.5rem 1rem", 
                        background: "#238636", 
                        borderRadius: "20px",
                        fontWeight: "bold"
                    }}>
                        {shape}
                    </span>
                ))}
            </div>
          </div>

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