import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
  useCarbon,
} from "@emrgen/carbon-react";
import { useCallback, useMemo } from "react";

export const PageTreeComp = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();

  const handleToggleCollapse = useCallback(() => {
    app.cmd.collapsible.toggle(node).Dispatch();
  }, [app.cmd.collapsible, node]);

  const content = useMemo(() => {
    if (node.firstChild?.name === "plainText") {
      return (
        <>
          <CarbonNodeContent
            node={node}
            key={node.key}
            wrapper={{ onClick: handleToggleCollapse, "data-test": 123 }}
            wrap={true}
          />
          {!node.isCollapsed && <CarbonNodeChildren node={node} />}
        </>
      );
    } else {
      return <CarbonNodeChildren node={node} />;
    }
  }, [handleToggleCollapse, node]);

  const onMouseDown = useCallback((e) => {
    // preventAndStop(e);
  }, []);

  return (
    <CarbonBlock node={node} custom={{ onMouseDown }}>
      {content}
    </CarbonBlock>
  );
};
