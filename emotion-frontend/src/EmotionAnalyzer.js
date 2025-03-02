// src/EmotionAnalyzer.js
import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { useNavigate } from 'react-router-dom';

function EmotionAnalyzer() {
  const webcamRef = useRef(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const captureAndAnalyze = async () => {
    setError(null);
    setResult(null);

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    const base64Image = imageSrc.split(',')[1];

    try {
      const response = await fetch('http://localhost:5000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      });

      const data = await response.json();

      if (response.ok && data.dominant_emotion) {
        setResult(data);
      } else {
        setError(data.error || "Unknown error occurred");
      }
    } catch (error) {
      setError("Failed to fetch analysis. Server might be down.");
      console.error("Error fetching analysis:", error);
    }
  };

  const handleNext = () => {
    // Pass the emotion analysis data to the TextEmotion page
    navigate("/textemotion", {
      state: {
        time: new Date(result.time * 1000).toLocaleTimeString(),
        emotion: result.dominant_emotion,
        confidence: result.emotion_confidence?.toFixed(2) ?? "N/A"
      }
    });
  };
  

  return (
    <div style={{ textAlign: 'center' }}>
      <h2>Emotion Detection</h2>
      <Webcam
        audio={false}
        screenshotFormat="image/jpeg"
        ref={webcamRef}
        style={{ width: '400px', height: '300px' }}
      />
      <br />
      <button onClick={captureAndAnalyze}>Analyze Emotion</button>

      {error && <p style={{ color: 'red' }}><strong>Error:</strong> {error}</p>}

      {result && (
        <div>
          <p><strong>Time:</strong> {new Date(result.time * 1000).toLocaleTimeString()}</p>
          <p><strong>Dominant Emotion:</strong> {result.dominant_emotion}</p>
          <p>
            <strong>Confidence:</strong>{' '}
            {result.emotion_confidence?.toFixed(2) ?? "N/A"}
          </p>
          <br />
          <button onClick={handleNext}>Next</button>
        </div>
      )}
    </div>
  );
}

export default EmotionAnalyzer;
