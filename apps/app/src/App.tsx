import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dev from "./carbon/Dev/Dev";
import Text from "./carbon/Dev/Text";
import Sheet from "./carbon/Sheet";
import { Question } from "./carbon/Question";
import { FastEditor } from "./fastype/FastEditor";

import './fastype/fastype.styl'
import TestText from "./carbon/Test/Text";

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dev />} />
        <Route path="/text" element={<Text />} />
        <Route path="/test" element={<TestText />} />
        <Route path="/sheet" element={<Sheet />} />
        <Route path="/question" element={<Question />} />
        <Route path="/fastype" element={<FastEditor name='fastype-test'/>} />
        {/* <Route path="/test" element={<Test />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
