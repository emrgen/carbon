import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
} from "@emrgen/carbon-react";
import { useMemo, useRef } from "react";
import { useDragDropRectSelectHalo } from "@emrgen/carbon-dragon-react";

export const BulletedListComp = (props: RendererProps) => {
  const { node, parent, custom } = props;

  const ref = useRef(null);
  const { connectors, SelectionHalo } = useDragDropRectSelectHalo({
    node,
    ref,
  });

  const beforeContent = useMemo(() => {
    return (
      <div
        contentEditable="false"
        suppressContentEditableWarning
        className="cbl__marker"
      >
        ●
      </div>
    );
  }, []);

  return (
    <CarbonBlock {...props} custom={{ ...connectors, ...custom }} ref={ref}>
      <CarbonNodeContent
        node={node}
        beforeContent={beforeContent}
        wrap={true}
        custom={{ className: "cbl__ti" }}
        className={"ctiw"}
      />
      <CarbonNodeChildren node={node} wrap={true} className={'cnest'}/>
      {SelectionHalo}
    </CarbonBlock>
  );
};
