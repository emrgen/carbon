import { Box, Button } from "@chakra-ui/react";
import {
  LocalDirtyCounterPath,
  ModePath,
  Transaction,
} from "@emrgen/carbon-core";
import { useCarbon } from "@emrgen/carbon-react";
import { useCallback, useEffect, useState } from "react";

export const ToggleViewMode = () => {
  const app = useCarbon();

  const [isEditable, setIsEditable] = useState(false);

  useEffect(() => {
    const node = app.content.find((n) => n.name === "document");
    if (!node) return;
    setIsEditable(node?.props.get(ModePath) === "edit");
  }, [app]);

  const makeNodesHiddenAfterContinue = useCallback(
    (cmd: Transaction, isEditable: boolean) => {
      if (isEditable) {
        // make all nodes visible
        app.state.content.all((n) => {
          if (n.isBlock) {
            cmd.Update(n, {
              ["local/html/data-visible"]: true,
            });
          }
        });
        return;
      }

      const cont = app.content.find((n) => {
        if (n.isBlock) {
          cmd.Update(n, {
            [LocalDirtyCounterPath]: new Date().getTime(),
          });
        }
        return n.name === "continue";
      });

      // mark all the nodes after the first content node as hidden
      if (!cont) return;

      cont.next((n) => {
        if (n.isBlock) {
          cmd.Update(n, {
            ["local/html/data-visible"]: isEditable,
          });
        }

        return false;
      });
    },
    [app],
  );

  const handleToggleMode = useCallback(() => {
    const node = app.content.find((n) => n.name === "document");
    if (!node) return;

    const { cmd } = app;
    cmd.Update(node.id, {
      [ModePath]: isEditable ? "view" : "edit",
      ["local/html/data-editable"]: !isEditable,
    });

    makeNodesHiddenAfterContinue(cmd, !isEditable);

    cmd.Dispatch();

    setIsEditable(!isEditable);
  }, [app, isEditable, makeNodesHiddenAfterContinue]);

  return (
    <Box pos={"absolute"} right={"10px"}>
      <Button size={"sm"} onClick={handleToggleMode}>
        {isEditable ? "Show View" : "Show Edit"} Mode
      </Button>
    </Box>
  );
};
