import React from "react";
import { NodeView } from "./Node";

export interface ObjectViewProps {
  data: Object;
}

class Name {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
}

const data = [
  // (a, b, c) => {},
  // _,
  // 1,
  // 2,
  // 3,
  // [1, 2],
  // "avira",
  // null,
  // true,
  // false,
  // undefined,
  // { a: 1 },
  // new Name("avira"),
  // [
  //   1,
  //   2,
  //   {
  //     a: 1,
  //     b: 2,
  //   },
  // ],
  // Symbol("avira"),
  document.createElementNS("http://www.w3.org/2000/svg", "svg"),
];

export const ObjectViewer = (props: ObjectViewProps) => {
  return (
    <div className={"carbon-object-view"}>
      <NodeView data={props.data} propName={""} isIndex={false} />
    </div>
  );
};
