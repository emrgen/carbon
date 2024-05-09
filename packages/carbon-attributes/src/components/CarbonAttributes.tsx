import React from "react";
import { RendererProps, useCarbon } from "@emrgen/carbon-react";
import { preventAndStop } from "@emrgen/carbon-core";

export function CarbonProps(props: RendererProps) {
  const { node } = props;
  const app = useCarbon();

  return (
    <div
      className="carbon-document-attrs"
      contentEditable={false}
      suppressContentEditableWarning
      onMouseDown={(e) => {
        preventAndStop(e);
        // react.blur();
      }}
      onMouseUp={preventAndStop}
    >
      {/*{nodeProps(node).map((prop) => {*/}
      {/*  return <CarbonProp node={node} prop={prop} key={prop.name} />;*/}
      {/*})}*/}
      {/*<div className="carbon-add-prop"> &nbsp;+&nbsp; Add Property</div>*/}
    </div>
  );
}
