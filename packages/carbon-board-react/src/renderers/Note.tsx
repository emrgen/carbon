import {
  CarbonBlock,
  CarbonChildren,
  RendererProps,
  useCarbon,
  useNodeActivated,
  useNodeSelected,
} from "@emrgen/carbon-react";
import {
  ActivatedPath,
  NodeIdSet,
  SelectedPath,
  stop,
} from "@emrgen/carbon-core";
import { useCallback, useEffect } from "react";
import { useSquareBoard } from "../context";

export const Note = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();
  const { selectedItems, activateItem, selectItems } = useSquareBoard();
  const { attributes: selectedAttributes, yes: isSelected } = useNodeSelected({
    node,
  });
  const { attributes: activeAttributes, yes: isActive } = useNodeActivated({
    node,
  });

  useEffect(() => {
    const set = NodeIdSet.fromIds(selectedItems);
    const inStore = set.has(node.id);

    if (isSelected && !inStore) {
      console.log("select", node.id);
      set.add(node.id);
      selectItems(set.toArray());
    } else if (!isSelected && inStore) {
      set.remove(node.id);
      selectItems(set.toArray());
    }
  }, [selectItems, node, selectedItems, isSelected]);

  useEffect(() => {
    if (isActive) {
      activateItem(node.id);
    }
  }, [activateItem, node.id, isActive]);

  const handleClick = useCallback(() => {
    const selected = NodeIdSet.fromIds(selectedItems);
    console.log("selected", selected.toArray());
    if (selected.has(node.id)) {
      if (selected.size === 1) {
        app.cmd.Update(node.id, { [ActivatedPath]: true }).Dispatch();
      } else {
        const { cmd } = app;
        selected.forEach((id) => {
          cmd.Update(id, { [SelectedPath]: false });
        });
        app.cmd.Update(node.id, { [SelectedPath]: false }).Dispatch();
      }
    } else {
      const { cmd } = app;
      selected.forEach((id) => {
        cmd.Update(id, { [SelectedPath]: false });
      });
      cmd.Update(node.id, { [SelectedPath]: true }).Dispatch();
    }
    selectItems([node.id]);
  }, [selectedItems, node.id, selectItems, app]);

  return (
    <CarbonBlock
      node={node}
      custom={{
        onClick: handleClick,
        onMouseDown: stop,
        ...selectedAttributes,
        ...activeAttributes,
      }}
    >
      <CarbonChildren node={node} />
    </CarbonBlock>
  );
};
