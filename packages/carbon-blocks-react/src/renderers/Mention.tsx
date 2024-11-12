import { preventAndStop } from "@emrgen/carbon-core";
import { CarbonBlock, RendererProps } from "@emrgen/carbon-react";
import { CarbonChildren } from "@emrgen/carbon-react";
import { useCarbon } from "@emrgen/carbon-react";

export const MentionComp = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();

  const handleOnClick = (e) => {
    preventAndStop(e);
    app.parkCursor();
    console.log("show information related to mention");
  };

  return (
    <CarbonBlock
      node={node}
      custom={{ onClick: handleOnClick, onMouseDown: preventAndStop }}
    >
      <CarbonChildren node={node} />
    </CarbonBlock>
  );
};
