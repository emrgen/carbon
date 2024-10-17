import { CarbonBlock, RendererProps } from "@emrgen/carbon-react";
import { useNodeChange } from "@emrgen/carbon-react";
import { useRef } from "react";
import { useEffect } from "react";
import { preventAndStop } from "@emrgen/carbon-core";
import { PiPlayBold } from "react-icons/pi";
import { isKeyHotkey } from "is-hotkey";

export const CellCodeComp = (props: RendererProps) => {
  const { node, onMount } = props;
  const editor = useRef();

  // tract node changes and confirm ui update to the change manager
  useNodeChange(props);

  useEffect(() => {
    onMount(editor.current);
  }, [onMount, editor]);

  return (
    <div
      className={"cell-code-wrapper"}
      onKeyDown={(e) => {
        if (isKeyHotkey("ctrl+s", e)) {
          preventAndStop(e);
          console.log("recompute cells");
        }
      }}
    >
      <CarbonBlock node={node} ref={editor} />
      <div
        className={"carbon-cell-compute-button"}
        onMouseDown={preventAndStop}
      >
        <PiPlayBold />
      </div>
    </div>
  );
};
