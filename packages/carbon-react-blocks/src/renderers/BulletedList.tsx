import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
  useSelectionHalo
} from "@emrgen/carbon-react";
import {useMemo, useRef} from "react";
import{
  useDragDropRectSelectHalo
} from "@emrgen/carbon-dragon-react";

export const BulletedListComp = (props: RendererProps) => {
  const { node, parent } = props;

  const ref = useRef(null);
  const {connectors, SelectionHalo} = useDragDropRectSelectHalo({node, ref})

  const beforeContent = useMemo(() => {
    return (
      <div
        contentEditable="false"
        suppressContentEditableWarning
        className="carbon-bulletedList__label"
      >
        ●
      </div>
    );
  }, []);

  return (
    <CarbonBlock {...props} custom={connectors} ref={ref}>
      <CarbonNodeContent
        node={node}
        beforeContent={beforeContent}
      />
      <CarbonNodeChildren node={node}/>
      {SelectionHalo}
    </CarbonBlock>
  );
};
