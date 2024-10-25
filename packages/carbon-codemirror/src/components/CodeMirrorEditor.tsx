import { indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { EditorState, Prec } from "@codemirror/state";
import { highlightActiveLine, keymap, ViewUpdate } from "@codemirror/view";
import {
  ActionOrigin,
  CodeValuePath,
  FocusOnInsertPath,
  Node,
  Pin,
  PinnedSelection,
  Point,
  yes,
} from "@emrgen/carbon-core";
import { RendererProps, useCarbon } from "@emrgen/carbon-react";
import { basicSetup, EditorView } from "codemirror";
import { isKeyHotkey } from "is-hotkey";
import { createRef, useCallback, useEffect, useState } from "react";
import { useCustomCompareEffect } from "react-use";

interface CodeMirrorEditorProps {
  onFocus?: () => void;
  onBlur?: () => void;
  node: Node;
  extensions?: any[];
}

export const CodeMirrorEditor = (props: RendererProps) => {
  const { node, onFocus, onBlur } = props;
  const app = useCarbon();
  const ref = createRef<HTMLDivElement>();
  const [nodeId] = useState(node.id);
  const [view, setView] = useState<EditorView | null>(null);

  const onUpdate = useCallback(
    (editor: ViewUpdate) => {
      const value = editor.state.doc.toString();

      if (editor.docChanged) {
        // update the cell code value
        app.cmd
          .update(nodeId, {
            [CodeValuePath]: value,
          })
          .Select(PinnedSelection.SKIP, ActionOrigin.UserInput)
          .Dispatch();
      }

      // track focus status
      if (editor.focusChanged) {
        if (editor.view.hasFocus) {
          onFocus?.();
        } else {
          onBlur?.();
        }
      }
    },
    [app, nodeId, onFocus, onBlur],
  );

  // create the editor view
  const createEditor = useCallback(
    (parent: HTMLElement, value: string) => {
      const extensions: any[] = [EditorView.lineWrapping, javascript()];

      const state = EditorState.create({
        doc: value,
        extensions: [
          ...extensions,
          EditorView.updateListener.of(onUpdate),
          basicSetup,
          highlightActiveLine(),
          keymap.of([indentWithTab]),
          Prec.highest(
            EditorView.domEventHandlers({
              keydown(event) {
                // insert new line
                if (event.ctrlKey && event.shiftKey && event.key === "Enter") {
                  event.preventDefault();
                  event.stopPropagation();
                  const parent = app.store.get(nodeId);
                  const section = app.schema.type("section").default();
                  console.log(parent);
                  const after = PinnedSelection.fromPin(
                    Pin.toStartOf(section!)!,
                  );
                  app.cmd
                    .Insert(Point.toAfter(parent!), section!)
                    .Select(after, ActionOrigin.UserInput)
                    .Dispatch();
                }
              },
            }),
          ),
        ],
      });

      return new EditorView({
        state,
        parent,
      });
    },
    [onUpdate, nodeId, app],
  );

  // update the editor view when the node content changes
  useCustomCompareEffect(
    () => {
      if (!ref.current) return;
      const view = createEditor(ref.current, node.props.get(CodeValuePath, ""));
      setView(view);
      return () => {
        view.destroy();
      };
    },
    [ref, node, createEditor],
    yes, // only run on mount never again.
  );

  // focus the editor when the cell is mounted
  useEffect(() => {
    const firstMount = app.store
      .get(nodeId)
      ?.props.get(FocusOnInsertPath, false);
    if (firstMount) {
      view?.focus();
      setTimeout(() => {
        app.cmd
          .Update(nodeId, {
            [FocusOnInsertPath]: false,
          })
          .Dispatch();
      }, 1000);
    }
  }, [view, app, nodeId]);

  return (
    <div
      className={"carbon-cm-container"}
      ref={ref}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (isKeyHotkey("ctrl+s")(e)) {
          e.preventDefault();
        }
      }}
      onFocus={(e) => e.stopPropagation()}
    />
  );
};