import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "./react-bem.styl";

import { Sight } from "./Main/Sight";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Sight />} />
      </Routes>
    </Router>
  );
}

export default App;
