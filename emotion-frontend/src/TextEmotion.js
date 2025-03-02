import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function TextEmotion() {
  const [text, setText] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [calculatedEmotion, setCalculatedEmotion] = useState(null);
  const navigate = useNavigate();

  // Get facial emotion and confidence from the previous page
  const location = useLocation();
  const { time, emotion: facialEmotion, confidence } = location.state || {};

  const handleSubmit = async () => {
    setError("");
    setAnalysis(null);

    if (!text.trim()) {
      setError("Please enter your feelings.");
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/analyze_text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() })
      });

      const data = await response.json();

      if (response.ok && data.dominant_emotion) {
        setAnalysis(data);
        setSubmitted(true);

        // Combine emotions (or take one) and set the calculated emotion
        const calculatedEmotion = combineEmotions(facialEmotion, data.dominant_emotion);
        setCalculatedEmotion(calculatedEmotion);
      } else {
        setError(data.error || "Error analyzing emotion");
      }
    } catch (err) {
      setError("Failed to fetch text emotion analysis");
      console.error(err);
    }
  };

  const combineEmotions = (facialEmotion, textEmotion) => {
    // Combine facial and text emotions
    if (facialEmotion === textEmotion) {
      return facialEmotion; // If both match, use the same emotion
    } else {
      // If they differ, choose a dominant one or create a combined label
      return `${facialEmotion}_${textEmotion}`; // Example: "Happy_Sad"
    }
  };

  const handleNext = () => {
    if (submitted && calculatedEmotion) {
      navigate('/tasks', { state: { emotion: calculatedEmotion } }); // Navigate to task page with calculated emotion
    } else {
      setError("Please submit your feelings first.");
    }
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2>Text Emotion Analysis</h2>
      <p>How do you feel today?</p>

      <textarea
        style={{ width: '400px', height: '100px', padding: '10px', fontSize: '16px' }}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter your feelings here..."
      />
      <br />

      <button
        onClick={handleSubmit}
        style={{ padding: '10px 20px', fontSize: '16px', marginTop: '10px' }}
      >
        Submit
      </button>

      <button
        onClick={handleNext}
        style={{ padding: '10px 20px', fontSize: '16px', marginTop: '10px', marginLeft: '10px' }}
      >
        Next
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {submitted && analysis && (
        <div style={{ marginTop: '20px' }}>
          <p><strong>Detected Emotion (Text):</strong> {analysis.dominant_emotion}</p>
          <p><strong>Confidence (Text):</strong> {analysis.emotion_confidence?.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
}

export default TextEmotion;
