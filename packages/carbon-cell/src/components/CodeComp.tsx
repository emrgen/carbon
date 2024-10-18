import { CarbonBlock, RendererProps } from "@emrgen/carbon-react";
import { useCarbon } from "@emrgen/carbon-react";
import { useRef } from "react";
import { useCallback } from "react";
import { useState } from "react";
import { useEffect } from "react";
import { preventAndStop } from "@emrgen/carbon-core";
import { PinnedSelection } from "@emrgen/carbon-core";
import { NodeId } from "@emrgen/carbon-core";
import { Node } from "@emrgen/carbon-core";
import { ActionOrigin } from "@emrgen/carbon-core";
import { HasFocusPath } from "@emrgen/carbon-core";
import { PiPlayBold } from "react-icons/pi";
import { useModule } from "../hooks/useModule";
import { CodeCellValuePath } from "../constants";
import { EditorState } from "@codemirror/state";
import { EditorView } from "codemirror";
import { basicSetup } from "codemirror";
import { ViewUpdate } from "@codemirror/view";
import { highlightActiveLine } from "@codemirror/view";
import { isKeyHotkey } from "is-hotkey";
import { javascript } from "@codemirror/lang-javascript";

const extensions = [javascript(), EditorView.lineWrapping];

export const CodeComp = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();
  const ref = useRef();
  const mod = useModule();
  const [value, setValue] = useState(node.props.get(CodeCellValuePath, ""));
  const [id] = useState(node.id.toString());
  const [parentId] = useState(node.parent?.id.toString()!);
  const [view, setView] = useState<EditorView | null>(null);

  // useEffect(() => {
  //   mod.redefine(NodeId.create(parentId));
  // }, [mod, parentId]);

  // focus should set the cell focus status
  const onFocused = useCallback(() => {
    if (app.store.get(NodeId.create(parentId))?.props.get(HasFocusPath)) return;
    app.cmd
      .Update(NodeId.create(parentId), {
        [HasFocusPath]: true,
      })
      .Select(PinnedSelection.SKIP, ActionOrigin.UserInput)
      .Dispatch();
  }, [app, parentId]);

  // blur should remove the cell focus status
  const onBlur = useCallback(() => {
    if (!app.store.get(NodeId.create(parentId))?.props.get(HasFocusPath))
      return;
    app.cmd
      .Update(NodeId.create(parentId), {
        [HasFocusPath]: false,
      })
      .Dispatch()
      .Then(() => {
        mod.redefine(NodeId.create(parentId));
      });
  }, [app, mod, parentId]);

  // when the cell is unmounted, remove the focus status
  useEffect(() => {
    return () => {
      onBlur();
    };
  }, [onBlur]);

  const onUpdate = useCallback(
    (editor: ViewUpdate) => {
      if (editor.docChanged) {
        const nodeId = NodeId.create(id);
        const parentID = NodeId.create(parentId);
        const parent = app.store.get(parentID);

        const tr = app.cmd.update(nodeId, {
          [CodeCellValuePath]: editor.state.doc.toString(),
        });

        tr.Select(PinnedSelection.SKIP, ActionOrigin.UserInput).Dispatch();
      }

      if (editor.focusChanged) {
        if (editor.view.hasFocus) {
          onFocused();
        } else {
          onBlur();
        }
      }
    },
    [id, parentId, app, onFocused, onBlur],
  );

  const createEditorView = useCallback(
    (parent: HTMLElement) => {
      const state = EditorState.create({
        doc: value,
        extensions: [
          ...extensions,
          EditorView.updateListener.of(onUpdate),
          basicSetup,
          highlightActiveLine(),
        ],
      });

      return new EditorView({
        state,
        parent,
      });
    },
    [value, onUpdate],
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
        console.log("keydown", e);
        if (isKeyHotkey("ctrl+s", e)) {
          preventAndStop(e);
          // find variable identity and redefine
          console.log("save", parentId, NodeId.create(parentId));
          mod.redefine(NodeId.create(parentId));
        }
      }}
      onFocus={(e) => e.stopPropagation()}
    >
      <CarbonBlock node={node} ref={ref} />
      <div
        className={"carbon-cell-compute-button"}
        onMouseDown={preventAndStop}
        onMouseUp={(e) => {
          preventAndStop(e);
          // find variable identity and redefine
          mod.redefine(NodeId.create(parentId));
        }}
      >
        <PiPlayBold />
      </div>
    </div>
  );
};
