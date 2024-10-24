import { Carbon } from "@emrgen/carbon-core";
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

  const handleToggleCollapse = useCallback(
    (app: Carbon) => {
      app.cmd.collapsible.toggle(node).Dispatch();
    },
    [node],
  );

  const content = useMemo(() => {
    if (node.firstChild?.name === "title") {
      return (
        <>
          <CarbonNodeContent
            node={node}
            key={node.key}
            custom={{ onClick: () => handleToggleCollapse(app) }}
            wrap={true}
          />
          {!node.isCollapsed && <CarbonNodeChildren node={node} />}
        </>
      );
    } else {
      return <CarbonNodeChildren node={node} />;
    }
  }, [app, handleToggleCollapse, node]);

  const onMouseDown = useCallback((e) => {
    // preventAndStop(e);
  }, []);

  return (
    <CarbonBlock node={node} custom={{ onMouseDown }}>
      {content}
    </CarbonBlock>
  );
};
