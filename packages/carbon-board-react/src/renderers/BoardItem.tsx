import {
  CarbonBlock,
  CarbonChildren,
  RendererProps,
} from "@emrgen/carbon-react";
import { useBoardElement } from "../hooks/useBoardElement";

export const BoardItem = (props: RendererProps) => {
  const { node } = props;
  const { attributes, listeners } = useBoardElement(props);
  return (
    <CarbonBlock
      node={node}
      custom={{
        ...attributes,
        ...listeners,
      }}
    >
      <CarbonChildren node={node} />
    </CarbonBlock>
  );
};
