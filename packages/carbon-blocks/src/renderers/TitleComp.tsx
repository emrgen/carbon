import React, { useCallback, useMemo } from "react";
import {
  CarbonBlock,
  CarbonChildren,
  InlineContent,
  RendererProps,
  useCarbon,
  Node,
  BlockContent,
} from "@emrgen/carbon-core";

export default function TitleComp(props: RendererProps) {
  const { node } = props;
  const app = useCarbon();

  // console.log('TitleComp', props);

  const onMouseDown = useCallback((e) => {
    // e.preventDefault();
  },[])

  const { parent } = node;

  const as = parent?.attrs.html["data-as"];
  console.log(
    "XX",
    parent?.id.toString(),
    as,
    app.schema.nodes[as]?.spec.attrs?.node?.emptyPlaceholder
  );
  

  const custom = node.isEmpty
    ? {
        onMouseDown,
        ...props.custom,
        placeholder:
          app.schema.nodes[as]?.spec.attrs?.node?.emptyPlaceholder ??
          props.custom?.placeholder ??
          node.parent?.attrs.node.placeholder ?? "",
      }
    : { onMouseDown, ...props.custom };

  const cloned = app.schema.cloneWithId(node);
  cloned.updateContent(BlockContent.create(app.schema.text(node.textContent + 'hello')!))

  return (
    <CarbonBlock {...props} custom={custom}>
      <CarbonChildren {...props} />
      {/* need to remove from dom before selection */}
      {/* <div className="carbon-ai-suggested">
        <CarbonChildren node={cloned} />
      </div> */}
    </CarbonBlock>
  );
}
