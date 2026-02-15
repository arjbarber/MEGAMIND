import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCerebellumReport } from '../gemini';
import { increaseStreak } from "../api";

interface Props {
  onSuccess: (part: string) => void;
  onBack: () => void;
}

const CerebellumTest: React.FC<Props> = ({ onSuccess, onBack }) => {
  const navigate = useNavigate();
  const [clickCount, setClickCount] = useState(0);
  const [targetPos, setTargetPos] = useState({ top: '50%', left: '50%' });
  const [isTesting, setIsTesting] = useState(false);
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasIncreasedStreak, setHasIncreasedStreak] = useState(false);

  const totalClicksNeeded = 5;
  const CEREBELLUM_ORANGE = "#FF8A00"; // Updated color anchor

  const handleGoBack = () => {
    if (onBack) onBack();
    navigate("/");
  };

  const moveTarget = () => {
    const top = Math.floor(Math.random() * 75 + 15) + '%';
    const left = Math.floor(Math.random() * 80 + 10) + '%';
    setTargetPos({ top, left });
  };

  const handleTargetClick = async () => {
    const nextCount = clickCount + 1;
    if (nextCount < totalClicksNeeded) {
      setClickCount(nextCount);
      moveTarget();
    } else {
      setIsTesting(false);
      setLoading(true);
      try {
        const aiReport = await getCerebellumReport(100);
        setReport(aiReport);
        if (onSuccess) onSuccess("cerebellum");
      } catch (e) {
        setReport("Scan complete. System stabilized under the sunset haze.");
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (report && !hasIncreasedStreak) {
      increaseStreak("cerebellum");
      setHasIncreasedStreak(true);
    }
  }, [report, hasIncreasedStreak]);

  const startTest = () => {
    setClickCount(0);
    setReport("");
    setIsTesting(true);
    setHasIncreasedStreak(false);
    moveTarget();
  };

  return (
    <div style={{...fullScreenContainer, color: CEREBELLUM_ORANGE}}>
      <div style={{...navBar, borderBottom: `1px solid ${CEREBELLUM_ORANGE}33`}}>
        <button onClick={handleGoBack} style={{...backButtonStyle, color: CEREBELLUM_ORANGE, borderColor: CEREBELLUM_ORANGE}}>
          ← BACK TO BRAIN
        </button>
        <div style={headerText}>
          <h2 style={titleStyle}>CEREBELLUM SCAN</h2>
          {isTesting && <p style={subTitleStyle}>PULSE {clickCount + 1} / {totalClicksNeeded}</p>}
        </div>
        <div style={{ width: '150px' }}></div>
      </div>
      
      {!isTesting && !report && !loading && (
        <div style={centerUI}>
          <p style={introText}>Verify motor coordination. Tap the orange pulses as they appear across the screen.</p>
          <button onClick={startTest} style={{...noirButtonStyle, background: CEREBELLUM_ORANGE}}>INITIATE SCAN</button>
        </div>
      )}

      {isTesting && (
        <div style={wideTestArea}>
          <button 
            onClick={handleTargetClick} 
            style={{ ...pulseStyle, background: CEREBELLUM_ORANGE, boxShadow: `0 0 40px ${CEREBELLUM_ORANGE}`, top: targetPos.top, left: targetPos.left }}
          />
        </div>
      )}

      {loading && <div style={centerUI}><p style={loadingText}>PROCESSING NEURAL VIBRATIONS...</p></div>}

      {report && (
        <div style={reportContainer}>
          <div style={{...reportCard, borderColor: CEREBELLUM_ORANGE}}>
            <p style={aiReportText}>"{report}"</p>
            <p style={{...encouragingText, color: CEREBELLUM_ORANGE}}>Reflexes verified. Motor pathways optimized, Detective.</p>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
              <button onClick={startTest} style={{...noirButtonStyleSmall, background: CEREBELLUM_ORANGE}}>RE-TEST</button>
              <button onClick={handleGoBack} style={{...noirButtonStyleSmall, background: CEREBELLUM_ORANGE}}>RETURN HOME</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* --- Visual Styles Updated for Orange --- */
const fullScreenContainer: React.CSSProperties = { background: '#050507', height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', fontFamily: '"Courier New", Courier, monospace', overflow: 'hidden' };
const navBar: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', background: 'rgba(10, 10, 12, 0.9)' };
const backButtonStyle: React.CSSProperties = { background: 'transparent', padding: '12px 24px', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px', transition: 'all 0.2s ease' };
const headerText = { textAlign: 'center' as const };
const titleStyle = { fontSize: '2rem', margin: '0', letterSpacing: '4px' };
const subTitleStyle = { color: '#556', fontSize: '1rem', margin: '5px 0 0' };
const wideTestArea: React.CSSProperties = { flex: 1, position: 'relative' };
const pulseStyle: React.CSSProperties = { position: 'absolute', width: '100px', height: '100px', borderRadius: '50%', border: '5px solid #fff', cursor: 'pointer', transform: 'translate(-50%, -50%)' };
const centerUI: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '40px' };
const introText = { fontSize: '1.6rem', color: '#889', marginBottom: '40px', textAlign: 'center' as const, maxWidth: '600px' };
const noirButtonStyle = { color: '#000', border: 'none', padding: '25px 50px', fontSize: '1.8rem', fontWeight: 'bold' as const, cursor: 'pointer', borderRadius: '8px' };
const noirButtonStyleSmall = { ...noirButtonStyle, padding: '15px 30px', fontSize: '1.2rem' };
const loadingText = { fontSize: '1.8rem', letterSpacing: '3px' };
const reportContainer: React.CSSProperties = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const reportCard: React.CSSProperties = { maxWidth: '800px', textAlign: 'center', border: '2px solid', padding: '60px', background: '#0a0a0c', borderRadius: '12px' };
const aiReportText = { fontSize: '2rem', color: '#fff', fontStyle: 'italic', marginBottom: '30px', lineHeight: '1.4' };
const encouragingText = { fontSize: '1.5rem', marginBottom: '40px' };

export default CerebellumTest;