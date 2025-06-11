import { CodeMirrorEditor } from "@emrgen/carbon-codemirror";
import { RendererProps } from "@emrgen/carbon-react";
import isHotkey from "is-hotkey";
import { useCallback, useMemo } from "react";
import { useReactiveRuntime } from "../hooks/useReactiveRuntime";
import { defineVariable } from "../x";

interface ReactiveCellEditorProps extends RendererProps {
  onFocus?: () => void;
}

// ReactiveCellEditor component for editing cell code or content
export const ReactiveCellEditor = (props: ReactiveCellEditorProps) => {
  const runtime = useReactiveRuntime();
  const { node, onFocus } = props;

  const isCollapsed = useMemo(() => {
    return node.isCollapsed;
  }, [node]);

  // define the variable when the editor is blurred
  const onBlur = useCallback(() => {
    defineVariable(runtime, node);
  }, [node, runtime]);

  const onKeydown = useCallback(
    (event: KeyboardEvent) => {
      // define the variable when Ctrl+S or Cmd+S is pressed
      if (isHotkey("mod+s", event)) {
        defineVariable(runtime, node);
      }
    },
    [node, runtime],
  );

  return (
    <div className={"carbon-reactive-cell-editor"}>
      <div className={"carbon-reactive-cell-editor-content"}>
        {!isCollapsed && (
          <CodeMirrorEditor node={node} onFocus={onFocus} onBlur={onBlur} onKeyDown={onKeydown} />
        )}
      </div>
    </div>
  );
};
