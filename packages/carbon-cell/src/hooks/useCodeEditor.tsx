import { javascript } from "@codemirror/lang-javascript";
import { ViewPlugin, ViewUpdate } from "@codemirror/view";
import { Node, PinnedSelection } from "@emrgen/carbon-core";
import { useCarbon } from "@emrgen/carbon-react";
import { useCodeMirror } from "@uiw/react-codemirror";
import { EditorView } from "codemirror";
import { useCallback } from "react";
import { CodeCellCodeValuePath } from "../constants";

const extensions = [javascript(), EditorView.lineWrapping];

export const useCodeEditor = (node: Node, value, editor) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const app = useCarbon();

  const updateCode = useCallback(
    (code: string) => {
      app.cmd
        .update(node, {
          [CodeCellCodeValuePath]: code,
        })
        .Select(PinnedSelection.SKIP)
        .Dispatch();
    },
    [app, node],
  );

  const { setContainer, view, state, container, setState } = useCodeMirror({
    container: editor.current,
    extensions: [
      ...extensions,
      ViewPlugin.fromClass(
        class {
          constructor(view) {}
          update(update: ViewUpdate) {
            // sync the cell code with the editor
            if (update.docChanged) {
              updateCode(update.state.doc.toString());
            }

            // update cell focus status
            if (update.focusChanged) {
              // if (update.view.hasFocus) {
              //   app.blur();
              //
              //   app.cmd
              //     .update(node.parent!, {
              //       [HasFocusPath]: true,
              //     })
              //     .Dispatch();
              // } else {
              //   app.cmd
              //     .update(node.parent!, {
              //       [HasFocusPath]: false,
              //     })
              //     .Dispatch();
              // }
            }
          }
        },
      ),
    ],
    basicSetup: {
      searchKeymap: false,
    },
    value: value,
    onChange(value, view) {},
  });

  return { setContainer, view, state, container };
};
