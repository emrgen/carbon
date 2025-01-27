import React from "react";
import { NodeView } from "./Node";

export interface ObjectViewProps {
  data: Object;
  field?: string;
  root?: boolean;
}

// class Name {
//   name: string;
//   constructor(name: string) {
//     this.name = name;
//   }
// }

// const data = [
//   // (a, b, c) => {},
//   // _,
//   // 1,
//   // 2,
//   // 3,
//   // [1, 2],
//   // "avira",
//   // null,
//   // true,
//   // false,
//   // undefined,
//   // { a: 1 },
//   // new Name("avira"),
//   // [
//   //   1,
//   //   2,
//   //   {
//   //     a: 1,
//   //     b: 2,
//   //   },
//   // ],
//   // Symbol("avira"),
//   document.createElementNS("http://www.w3.org/2000/svg", "svg"),
// ];

// ObjectViewer component is used to display the object in a tree structure.
export const ObjectViewer = (props: ObjectViewProps) => {
  const { data, field = "", root } = props;
  return (
    <div className={"carbon-object-view"}>
      <NodeView data={props.data} propName={field} isIndex={false} root={root} />
    </div>
  );
};
