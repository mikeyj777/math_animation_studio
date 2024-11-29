// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MathAnimationControls from './components/MathAnimationControls';
import ReactionDiffusion from './components/ReactionDiffusion';
import './App.css';
import './styles/global.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/anim-controls" element={<MathAnimationControls />} />
        <Route path="/reaction-diffusion" element={<ReactionDiffusion />} />
      </Routes>
    </Router>
  );
}

export default App;