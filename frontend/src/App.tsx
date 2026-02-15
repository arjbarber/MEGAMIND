import { Routes, Route } from "react-router-dom";
import BrainHome from "./pages/BrainHome";
import Prefrontal from "./pages/Prefrontal";
import Temporal from "./pages/Temporal";
import Occipital from "./pages/Occipital";
import Cerebellum from "./pages/Cerebellum";
import Parietal from "./pages/Parietal";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<BrainHome />} />
      <Route path="/prefrontal" element={<Prefrontal />} />
      <Route path="/temporal" element={<Temporal />} />
      <Route path="/occipital" element={<Occipital />} />
      <Route path="/cerebellum" element={<Cerebellum />} />
      <Route path="/parietal" element={<Parietal />} />
    </Routes>
  );
}
