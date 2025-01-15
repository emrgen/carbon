import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./react-bem.styl";

import "./fastype/fastype.styl";
import { SidebarLayout } from "./carbon/Dev/SidebarLayout";
import { LazyDev } from "./carbon/index";

function App() {
  return (
    <Router>
      <Routes>
        {/*<Route path="/demo/map" element={<MMap />} />*/}
        {/*<Route path="/demo/draggable" element={<LazyDraggableDemo />} />*/}
        {/*<Route path="/demo/emoji" element={<LazyEmojiDemo />} />*/}
        {/*<Route path="/design" element={<LazyDesign />} />*/}
        {/*<Route path="/board" element={<LazyBoard />} />*/}
        {/*<Route path="/affine" element={<AffineExp />} />*/}
        {/*<Route path="/chain" element={<Chain />} />*/}
        {/*<Route path="/text" element={<Text />} />*/}
        {/*<Route path="/object-viewer" element={<ObjectView />} />*/}
        {/*<Route path="/poc/grouped" element={<Grouped />} />*/}
        {/*<Route path="/test" element={<TestText />} />*/}
        {/*<Route path="/sheet" element={<Sheet />} />*/}
        {/*<Route path="/question" element={<Question />} />*/}
        {/*<Route path="/fastype" element={<FastEditor name="fastype-test" />} />*/}
        {/*<Route path="/test" element={<Test />} />*/}
        <Route path="/sidebar" element={<SidebarLayout />} />
        <Route path="/" element={<LazyDev />} />
      </Routes>
    </Router>
  );
}

export default App;
