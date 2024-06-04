import {
  CarbonBlock,
  CarbonChildren,
  RendererProps,
  useCarbon,
  useNodeActivated,
  useNodeSelected,
} from "@emrgen/carbon-react";
import { stop } from "@emrgen/carbon-core";
import { useSquareBoard } from "../context";
import { useRef, useState } from "react";

export const Note = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();
  const board = useSquareBoard();
  const ref = useRef<any>();
  const [isEditable, setIsEditable] = useState(false);
  const { attributes: selectedAttributes, yes: isSelected } = useNodeSelected({
    node,
  });
  const { attributes: activeAttributes, yes: isActive } = useNodeActivated({
    node,
  });

  // focus the node when editable
  // useEffect(() => {
  //   const editable = node.props.get(ContenteditablePath, false);
  //   if (isEditable !== editable) {
  //     if (editable) {
  //       // console.log("focus", ref.current);
  //       const pin = Pin.toEndOf(node)!;
  //       const after = PinnedSelection.fromPin(pin);
  //       app.cmd.Select(after).Dispatch();
  //     }
  //     setIsEditable(editable);
  //   }
  // }, [app, isEditable, node]);

  return (
    <CarbonBlock
      node={node}
      ref={ref}
      custom={{
        onClick: (e) => board.onClick(e, node),
        onMouseDown: (e) => {
          stop(e);
          board.onMouseDown(e, node.id);
        },
        ...selectedAttributes,
        ...activeAttributes,
      }}
    >
      <CarbonChildren node={node} />
    </CarbonBlock>
  );
};
