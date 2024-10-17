import { CarbonBlock, RendererProps } from "@emrgen/carbon-react";
import { useCarbon } from "@emrgen/carbon-react";
import { useRef } from "react";
import { useCallback } from "react";
import { useState } from "react";
import { useEffect } from "react";
import { preventAndStop } from "@emrgen/carbon-core";
import { PinnedSelection } from "@emrgen/carbon-core";
import { NodeId } from "@emrgen/carbon-core";
import { HasFocusPath } from "@emrgen/carbon-core";
import { Node } from "@emrgen/carbon-core";
import { PiPlayBold } from "react-icons/pi";
import { isKeyHotkey } from "is-hotkey";
import { useModule } from "../hooks/useModule";
import { CodeCellValuePath } from "../constants";
import { javascript } from "@codemirror/lang-javascript";
import { EditorState } from "@codemirror/state";
import { EditorView } from "codemirror";
import { ViewUpdate } from "@codemirror/view";

const extensions = [javascript()];

export const CellCodeComp = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();
  const ref = useRef();
  const mod = useModule();
  const [value, setValue] = useState(node.props.get(CodeCellValuePath, ""));
  const [id] = useState(node.id.toString());
  const [parentId] = useState(node.parent?.id.toString()!);
  const [view, setView] = useState<EditorView | null>(null);

  // focus should set the cell focus status
  const onFocused = useCallback(() => {
    app.cmd
      .Update(NodeId.create(parentId), {
        [HasFocusPath]: true,
      })
      .Select(PinnedSelection.SKIP)
      .Dispatch();
  }, [app, parentId]);

  // blur should remove the cell focus status
  const onBlur = useCallback(() => {
    app.cmd
      .Update(NodeId.create(parentId), {
        [HasFocusPath]: false,
      })
      .Dispatch();
  }, [app, parentId]);

  // when the cell is unmounted, remove the focus status
  useEffect(() => {
    return () => {
      onBlur();
    };
  }, [onBlur]);

  const onUpdate = useCallback(
    (editor: ViewUpdate) => {
      console.log(editor);
      if (editor.docChanged) {
        const nodeId = NodeId.create(id);
        app.cmd
          .update(nodeId, {
            [CodeCellValuePath]: editor.state.doc.toString(),
          })
          .Select(PinnedSelection.SKIP)
          .Dispatch();
      }

      if (editor.focusChanged) {
        if (editor.view.hasFocus) {
          onFocused();
        } else {
          onBlur();
        }
      }
    },
    [app, id, onFocused, onBlur],
  );

  const createEditorView = useCallback(
    (parent: HTMLElement) => {
      const state = EditorState.create({
        doc: value,
        extensions: [...extensions, EditorView.updateListener.of(onUpdate)],
      });

      return new EditorView({
        state,
        parent,
      });
    },
    [onUpdate, value],
  );

  useEffect(() => {
    if (!ref.current) return;
    const view = createEditorView(ref.current);
    setView(view);
    return () => {
      view.destroy();
    };
  }, [createEditorView, ref]);

  useEffect(() => {
    const onExpand = (parent: Node) => {
      console.log("-------------------------------", "onExpand");
      view?.focus();
    };
    const expandEvent = `expand:${parentId}`;
    mod.on(expandEvent, onExpand);

    return () => {
      mod.off(expandEvent, onExpand);
    };
  }, [view, mod, parentId]);

  return (
    <div
      className={"cell-code-wrapper"}
      onKeyDown={(e) => {
        if (isKeyHotkey("ctrl+s", e)) {
          preventAndStop(e);
          // find variable identity and redefine
          mod.redefine(node);
        }
      }}
    >
      <CarbonBlock node={node} ref={ref} />
      <div
        className={"carbon-cell-compute-button"}
        onMouseDown={preventAndStop}
      >
        <PiPlayBold />
      </div>
    </div>
  );
};
