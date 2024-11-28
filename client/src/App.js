// App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AnimationSelector from './components/AnimationSelector ';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/anim-select" element={<AnimationSelector />} />
      </Routes>
    </Router>
  );
}

export default App;