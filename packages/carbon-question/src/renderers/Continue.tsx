import { Node } from "@emrgen/carbon-core";
import {
  CarbonBlock,
  CarbonNode,
  RendererProps,
  useCarbon,
  useSelectionHalo,
} from "@emrgen/carbon-react";
import { useDocument } from "@emrgen/carbon-react-blocks";
import { useCallback } from "react";

export const ContinueComp = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();
  const { isEditable } = useDocument();
  const { SelectionHalo } = useSelectionHalo(props);

  const onClick = useCallback(() => {
    if (isEditable) return;

    // find next continue node
    const nodes: Node[] = [];
    node.next((n) => {
      nodes.push(n);
      return n.name === "continue";
    });

    // make the collection of nodes to be visible
    const { cmd } = app;
    nodes.forEach((n) => {
      cmd.Update(n, {
        ["local/html/data-visible"]: true,
      });
    });
    cmd.Update(node, {
      ["local/html/data-visible"]: false,
    });
    cmd.Dispatch();
  }, [app, isEditable, node]);

  return (
    <CarbonBlock node={node}>
      {node.children.map((child, index) => {
        return (
          <div className={"button-wrapper"} key={child.key}>
            <CarbonNode node={child} custom={{ onClick }} />
          </div>
        );
      })}
      {SelectionHalo}
    </CarbonBlock>
  );
};
