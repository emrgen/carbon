import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./react-bem.styl";

import "./fastype/fastype.styl";
import { MMap } from "./carbon/Demo/MMap";
import { AffineExp } from "./carbon/Dev/Affine";
import { LazyBoard, LazyDesign, LazyDev, LazyEmojiDemo } from "./carbon/index";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/demo/map" element={<MMap />} />
        {/*<Route path="/demo/draggable" element={<LazyDraggableDemo />} />*/}
        <Route path="/demo/emoji" element={<LazyEmojiDemo />} />
        <Route path="/design" element={<LazyDesign />} />
        <Route path="/board" element={<LazyBoard />} />
        <Route path="/affine" element={<AffineExp />} />
        {/*<Route path="/chain" element={<Chain />} />*/}
        {/*<Route path="/text" element={<Text />} />*/}
        {/*<Route path="/object-viewer" element={<ObjectView />} />*/}
        {/*<Route path="/poc/grouped" element={<Grouped />} />*/}
        {/*<Route path="/test" element={<TestText />} />*/}
        {/*<Route path="/sheet" element={<Sheet />} />*/}
        {/*<Route path="/question" element={<Question />} />*/}
        {/*<Route path="/fastype" element={<FastEditor name="fastype-test" />} />*/}
        {/* <Route path="/test" element={<Test />} /> */}
        <Route path="/" element={<LazyDev />} />
      </Routes>
    </Router>
  );
}

export default App;
