// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ReactionDiffusion from './components/ReactionDiffusion';
import Home from './components/Home';
import './styles/App.css'; // Optional global styles
import './styles/global.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <nav className="nav-bar">
          <Link to="/">Home</Link>
          <Link to="/reaction-diffusion">Reaction Diffusion</Link>
        </nav>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/reaction-diffusion" element={<ReactionDiffusion />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
