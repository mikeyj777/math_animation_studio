// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MathAnimationControls from './components/MathAnimationControls ';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/anim-controls" element={<MathAnimationControls />} />
      </Routes>
    </Router>
  );
}

export default App;