import {
  CarbonBlock,
  CarbonChildren,
  RendererProps,
  useCarbon,
} from "@emrgen/carbon-react";
import { SquareBoardContext } from "../context";
import { useSquareBoardStore } from "../state/states";
import { preventAndStop, SelectedPath } from "@emrgen/carbon-core";
import { useCallback } from "react";

export const Board = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();

  const store = useSquareBoardStore();

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      preventAndStop(e);
      console.log("handleMouseDown", store.selectedItems);

      const { cmd } = app;
      store.selectedItems.forEach((id) => {
        cmd.Update(id, { [SelectedPath]: false });
      });
      cmd.Dispatch();
    },
    [app, store.selectedItems],
  );

  return (
    <SquareBoardContext.Provider value={store}>
      <CarbonBlock node={node} custom={{ onMouseDown: handleMouseDown }}>
        <CarbonChildren node={node} />
      </CarbonBlock>
    </SquareBoardContext.Provider>
  );
};
