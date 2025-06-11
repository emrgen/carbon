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
import { useCarbon } from "@emrgen/carbon-react";
import { basicSetup, EditorView } from "codemirror";
import { isKeyHotkey } from "is-hotkey";
import { createRef, useCallback, useEffect, useRef, useState } from "react";
import { useCustomCompareEffect } from "react-use";

interface CodeMirrorEditorProps {
  onChange?: (editor: EditorState) => void;
  onSave?: (editor: EditorState) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  node: Node;
  extensions?: any[];
}

export const CodeMirrorEditor = (props: CodeMirrorEditorProps) => {
  const { node, onFocus, onBlur, onKeyDown } = props;
  const app = useCarbon();
  const ref = createRef<HTMLDivElement>();
  const [nodeId] = useState(node.id);
  const [view, setView] = useState<EditorView | null>(null);

  const handleKeyDown = useRef<(event: KeyboardEvent) => void>((e) => {
    onKeyDown?.(e);
  });
  const handleFocus = useRef<() => void>(() => {
    onFocus?.();
  });
  const handleBlur = useRef<() => void>(() => {
    onBlur?.();
  });

  useEffect(() => {
    handleKeyDown.current = onKeyDown || ((event) => {});
  }, [onKeyDown]);

  useEffect(() => {
    handleFocus.current = onFocus || (() => {});
  }, [onFocus]);

  useEffect(() => {
    handleBlur.current = onBlur || (() => {});
  }, [onBlur]);

  useEffect(() => {
    // if (node.)
  }, []);

  const onUpdate = useCallback(
    (editor: ViewUpdate) => {
      const value = editor.state.doc.toString();

      if (editor.docChanged) {
        // update the cell code value
        app.cmd
          .Update(nodeId, {
            [CodeValuePath]: value,
          })
          .Select(PinnedSelection.SKIP, ActionOrigin.UserInput)
          .Dispatch();
      }

      // track focus status
      // if (editor.focusChanged) {
      //   if (editor.view.hasFocus) {
      //     onFocus?.();
      //   } else {
      //     onBlur?.();
      //   }
      // }
    },
    [app, nodeId],
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
                handleKeyDown.current(event);
                // insert new line
                if (event.ctrlKey && event.shiftKey && event.key === "Enter") {
                  event.preventDefault();
                  event.stopPropagation();
                  const parent = app.store.get(nodeId);
                  const section = app.schema.type("paragraph").default();

                  const after = PinnedSelection.fromPin(Pin.toStartOf(section!)!);
                  app.cmd
                    .Insert(Point.toAfter(parent!), section!)
                    .Select(after, ActionOrigin.UserInput)
                    .Dispatch();
                }
              },
              focus: () => handleFocus.current(),
              blur: () => handleBlur.current(),
            }),
          ),
        ],
      });

      return new EditorView({
        state,
        parent,
      });
    },
    [onUpdate, app, nodeId],
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
    const firstMount = app.store.get(nodeId)?.props.get(FocusOnInsertPath, false);
    console.log("firstMount", firstMount);
    if (firstMount) {
      view?.focus();
      setTimeout(() => {
        app.cmd
          .SelectBlocks([])
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
      onFocus={(e) => {
        e.stopPropagation();
      }}
    />
  );
};
