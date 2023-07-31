import React from "react";

import { RendererProps, preventAndStop, useCarbon } from "@emrgen/carbon-core";
import { hasProps, nodeProps } from "../utils";
import CarbonProp from "./CarbonAttribute";

export function CarbonProps(props: RendererProps) {
  const { node } = props;
  const app = useCarbon();

  if (!hasProps(node)) return null;

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
      {nodeProps(node).map((prop) => {
        return <CarbonProp node={node} prop={prop} key={prop.name} />;
      })}
      <div className="carbon-add-prop"> &nbsp;+&nbsp; Add Property</div>
    </div>
  );
}
