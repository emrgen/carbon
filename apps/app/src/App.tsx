import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dev from './pages/Dev/Dev';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dev />} />
        {/* <Route path="/test" element={<Test />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
