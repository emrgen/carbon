import "./App.css";
import { BrowserRouter, NavLink } from "react-router-dom";
import { Demo } from "./Demo/Demo";

export default function App() {
  return (
    <BrowserRouter>
      <div className={"carbon-app-container"}>
        <div className={"carbon-demo-header"}>
          <NavLink to={"/"}>
            <div className={"demo-name"}>Empty</div>
          </NavLink>
          <NavLink to={"/plain"}>
            <div className={"demo-name"}>Plain</div>
          </NavLink>
          <NavLink to={"/list"}>
            <div className={"demo-name"}>List</div>
          </NavLink>
        </div>
        <Demo />
      </div>
    </BrowserRouter>
  );
}
