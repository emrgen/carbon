import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Dev from "./carbon/Dev/Dev";
import Text from "./carbon/Dev/Text";
import Sheet from "./carbon/Sheet";
import { FastEditor } from "./fastype/FastEditor";

import "./fastype/fastype.styl";
import TestText from "./carbon/Test/Text";
import { Grouped } from "./carbon/Poc/Grouped";
import "./react-bem.styl";
import { ObjectView } from "./carbon/Dev/ObjectView";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dev />} />
        {/*<Route path="/chain" element={<Chain />} />*/}
        <Route path="/text" element={<Text />} />
        <Route path="/object-viewer" element={<ObjectView />} />
        <Route path="/poc/grouped" element={<Grouped />} />
        <Route path="/test" element={<TestText />} />
        <Route path="/sheet" element={<Sheet />} />
        {/*<Route path="/question" element={<Question />} />*/}
        <Route path="/fastype" element={<FastEditor name="fastype-test" />} />
        {/* <Route path="/test" element={<Test />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
