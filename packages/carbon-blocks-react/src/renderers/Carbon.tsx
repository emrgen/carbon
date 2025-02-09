import { useDndRegion } from "@emrgen/carbon-dragon-react";
import { CarbonBlock, CarbonChildren, RendererProps } from "@emrgen/carbon-react";
import { useRef } from "react";

export const CarbonComp = (props: RendererProps) => {
  const { node } = props;
  const ref = useRef<Element>(null);
  const { listeners } = useDndRegion({ node, ref });

  return (
    <CarbonBlock node={node} ref={ref} custom={{ ...listeners }}>
      <CarbonChildren node={node} />
    </CarbonBlock>
  );
};
