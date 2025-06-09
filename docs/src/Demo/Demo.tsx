import { Route, Routes } from "react-router-dom";
import { Empty } from "./Empty";
import { List } from "./List";
import { PlainText } from "./PlainText";

export const Demo = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<Empty />} />
        <Route path="/plain" element={<PlainText />} />
        <Route path="/list" element={<List />} />
        <Route path="/media" element={<List />} />
        <Route path="/text-style" element={<List />} />
        <Route path="/emoji" element={<List />} />
        <Route path="/mention" element={<List />} />
        <Route path="/embed" element={<List />} />
        <Route path="/board" element={<List />} />
        <Route path="/design" element={<List />} />
        <Route path="/cell" element={<List />} />
        <Route path="/question" element={<List />} />
        <Route path="/comment" element={<List />} />
      </Routes>
    </>
  );
};
