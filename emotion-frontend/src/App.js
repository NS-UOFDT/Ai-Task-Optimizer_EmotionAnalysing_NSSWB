import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import EmotionAnalyzer from './EmotionAnalyzer';
import TextEmotion from './TextEmotion';
import TasksPage from './TasksPage'; 
import Dtask from './Dtask';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard/*" element={<Dashboard />} />
        <Route path="/emotion" element={<EmotionAnalyzer />} />
        <Route path="/textemotion" element={<TextEmotion />} />
        <Route path="/tasks" element={<TasksPage />} /> {}
        <Route path="/dotask" element={<Dtask />} />
      </Routes>
    </Router>
  );
}

export default App;
