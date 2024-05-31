import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
  useCarbon,
} from "@emrgen/carbon-react";
import {
  CollapsedPathLocal,
  ModePath,
  Pin,
  PinnedSelection,
} from "@emrgen/carbon-core";
import { useDocument } from "../hooks/useDocument";
import { useCallback } from "react";

export const PartialComp = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();
  const doc = useDocument();

  const isEditing = doc.props.get<string>(ModePath, "view") === "edit";
  const isCollapsed = node.props.get(CollapsedPathLocal, true);

  const handleToggle = useCallback(() => {
    const { cmd } = app;
    const after = PinnedSelection.fromPin(Pin.toEndOf(node.firstChild!)!);

    cmd.Update(node.id, { [CollapsedPathLocal]: !isCollapsed });
    cmd.select(after).dispatch();
  }, [app, node, isCollapsed]);

  return (
    <CarbonBlock
      node={node}
      key={`partial-${node.id}-${isEditing ? "edit" : "view"}`}
      custom={{
        ...(!isEditing
          ? {
              "data-collapsed": isCollapsed,
              suppressContentEditableWarning: true,
            }
          : { "data-mode": "edit" }),
      }}
    >
      <div className={"carbon-partial-body"}>
        <CarbonNodeContent node={node} />
        <CarbonNodeChildren node={node} />
      </div>

      {/*TOOD: only show the collaps/expand button if the content is overflowing*/}
      {!isEditing && (
        <div
          className={"carbon-partial-footer"}
          contentEditable={false}
          onClick={handleToggle}
        >
          {isCollapsed ? "Expand" : "Collapse"}
        </div>
      )}
    </CarbonBlock>
  );
};
