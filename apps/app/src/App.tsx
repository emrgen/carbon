import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dev from "./pages/Dev/Dev";
import Text from "./pages/Dev/Text";
import Sheet from "./pages/Sheet";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dev />} />
        <Route path="/text" element={<Text />} />
        <Route path="/sheet" element={<Sheet />} />
        {/* <Route path="/test" element={<Test />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
