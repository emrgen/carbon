import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
  useCarbon,
} from "@emrgen/carbon-react";
import { CollapsedPath, Pin, PinnedSelection } from "@emrgen/carbon-core";

export const PartialComp = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();

  const isCollapsed = node.props.get(CollapsedPath, true);

  const handleToggle = () => {
    const { cmd } = app;
    cmd.collapsible.toggle(node);
    if (isCollapsed) {
      const after = PinnedSelection.fromPin(Pin.toEndOf(node.firstChild!)!);
      cmd.select(after);
    } else {
      const after = PinnedSelection.fromPin(
        Pin.toEndOf(node.prev((n) => n.isTextContainer)!)!,
      );
      cmd.select(after);
    }
    cmd.dispatch();
  };

  return (
    <CarbonBlock
      node={node}
      custom={{
        "data-collapsed": isCollapsed,
        contentEditable: !isCollapsed,
        suppressContentEditableWarning: true,
      }}
    >
      <div className={"carbon-partial-body"}>
        <CarbonNodeContent node={node} />
        <CarbonNodeChildren node={node} />
      </div>

      <div
        className={"carbon-partial-footer"}
        contentEditable={false}
        onClick={handleToggle}
      >
        {isCollapsed ? "Expand" : "Collapse"}
      </div>
    </CarbonBlock>
  );
};
