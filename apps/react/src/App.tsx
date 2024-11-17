import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Design } from "./carbon/Dev/Design";
import Dev from "./carbon/Dev/Dev";
import { ObjectView } from "./carbon/Dev/ObjectView";
import Text from "./carbon/Dev/Text";
import {AffineExp} from "./carbon/Dev/Affine";
import { Grouped } from "./carbon/Poc/Grouped";
import "./react-bem.styl";
import Sheet from "./carbon/Sheet";
import TestText from "./carbon/Test/Text";
import { FastEditor } from "./fastype/FastEditor";

import "./fastype/fastype.styl";
import { Board } from "./carbon/Dev/Board";
import { DraggableDemo } from "./carbon/Demo/Draggable";
import { EmojiDemo } from "./carbon/Demo/Emoji";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dev />} />
        <Route path="/demo/draggable" element={<DraggableDemo />} />
        <Route path="/demo/emoji" element={<EmojiDemo />} />
        <Route path="/design" element={<Design />} />
        <Route path="/board" element={<Board />} />
        <Route path="/affine" element={<AffineExp />} />
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
