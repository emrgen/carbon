import React, { useEffect } from "react";
import { Box } from "@chakra-ui/react";

import { useCarbon } from "@emrgen/carbon-react";

export const PathTracker = (props) => {
  const { style } = props;
  const app = useCarbon();
  const [names, setNames] = React.useState("");

  useEffect(() => {
    const onChange = (state) => {
      const { selection } = state;
      if (selection.isCollapsed) {
        const { head } = selection;
        const nodeNames = head
          .down()
          .node.chain.map((node) => node.name)
          .reverse()
          .join(" > ");
        setNames(nodeNames);
      }
    };

    app.on("changed", onChange);
    return () => {
      app.off("changed", onChange);
    };
  }, [app]);

  return (
    <Box
      pos={"absolute"}
      top={0}
      w={"full"}
      fontSize={"12px"}
      px={2}
      py={1}
      style={style}
    >
      {names}
    </Box>
  );
};
