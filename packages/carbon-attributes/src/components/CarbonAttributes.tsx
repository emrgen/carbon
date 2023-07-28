import React from "react";

import { RendererProps, preventAndStop, useCarbon } from "@emrgen/carbon-core";
import { hasAttrs, nodeAttrs } from "../utils";
import CarbonAttribute from "./CarbonAttribute";

export function CarbonAttributes(props: RendererProps) {
  const { node } = props;
  const app = useCarbon();

  if (!hasAttrs(node)) return null;

  return (
    <div
      className="carbon-document-attrs"
      contentEditable={false}
      suppressContentEditableWarning
      onMouseDown={(e) => {
        preventAndStop(e);
        app.blur();
      }}
      onMouseUp={preventAndStop}
    >
      {nodeAttrs(node).map((attr) => {
        return <CarbonAttribute node={node} attr={attr} key={attr.name} />;
      })}
    </div>
  );
}

// {
//   hasAttrs(node) && (
//     <div
//       className="carbon-document-attrs"
//       contentEditable={false}
//       suppressContentEditableWarning
//       onMouseDown={(e) => {
//         preventAndStop(e);
//         app.blur();
//       }}
//       onMouseUp={preventAndStop}
//     >
//       {nodeAttrs(node).map((attr) => {
//         return renderAttr(node, attr);
//       })}
//     </div>
//   );
// }
