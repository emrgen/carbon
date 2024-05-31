import React, { useMemo } from "react";

import { CarbonBlock, RendererProps } from "@emrgen/carbon-react";
import { AttrNamePath, AttrTypePath } from "../constants";

export default function CarbonAttribute(props: RendererProps) {
  const { node } = props;
  const attr = useMemo(() => {
    const type = node.props.get(AttrTypePath, "");
    const name = node.props.get(AttrNamePath, "");
    return {
      type,
      name,
    };
  }, [node]);

  return (
    <CarbonBlock node={node}>
      <div className={"carbon-attribute-label"}>
        <div className="carbon-attribute-type">x</div>
        <div className="carbon-attribute-name">{attr.name}</div>
      </div>
      <div className="carbon-attribute-value-wrapper">
        <CarbonAttrValue node={node} />
      </div>
    </CarbonBlock>
  );
}

const CarbonAttrValue = (props: RendererProps) => {
  const { node } = props;
  const attr = useMemo(() => {
    const type = node.props.get(AttrTypePath, "");
    const name = node.props.get(AttrNamePath, "");
    return {
      type,
      name,
    };
  }, [node]);

  return <div className="carbon-attribute-value">{attr.type}</div>;
};
