import { Box } from "@chakra-ui/react";
import { State } from "@emrgen/carbon-core";

import { useCarbon } from "@emrgen/carbon-react";
import React, { useEffect } from "react";

export const PathTracker = (props) => {
  const { style } = props;
  const app = useCarbon();
  const [names, setNames] = React.useState("");

  useEffect(() => {
    const onChange = (state: State) => {
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

    // TODO: get the focused node from state.focused

    app.on("changed", onChange);
    return () => {
      app.off("changed", onChange);
    };
  }, [app]);

  return (
    <Box pos={"absolute"} top={0} w={"full"} height={10} fontSize={"12px"} px={2} py={1} style={style} zIndex={1000}>
      {names}
    </Box>
  );
};
