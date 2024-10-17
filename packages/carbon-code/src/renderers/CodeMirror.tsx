import { useCallback, useMemo, useRef, useState } from "react";
import {
  CarbonBlock,
  RendererProps,
  useCarbon,
  useEventTracker,
} from "@emrgen/carbon-react";
import { basicSetup, EditorView } from "codemirror";
import { EditorState } from "@codemirror/state";
import { lineNumbers, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";
import { Optional } from "@emrgen/types";
import { PointedSelection } from "@emrgen/carbon-core";
import { PinnedSelection } from "@emrgen/carbon-core";
import { CodeMirrorContentPath } from "../plugins/CodeMirror";
import { isKeyHotkey } from "is-hotkey";

export const CodeMirrorComp = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();
  const eventTracker = useEventTracker();
  const ref = useRef<any>(null);
  const [editor, setEditor] = useState<Optional<EditorView>>(null);

  const code = useMemo(() => {
    return node.props.get(CodeMirrorContentPath, "");
  }, [node]);

  const moundEditor = useCallback(
    (parent: any) => {
      const state = EditorState.create({
        extensions: [
          basicSetup,
          lineNumbers({}),
          ViewPlugin.fromClass(
            class {
              constructor(view) {}

              update(update: ViewUpdate) {
                // if (!update.view.hasFocus) {
                //   if (
                //     node.props.get(CodeMirrorContentPath) !==
                //     update.state.doc.toString()
                //   ) {
                //     app.cmd
                //       .update(node, {
                //         [CodeMirrorContentPath]: update.state.doc.toString(),
                //       })
                //       .Select(PinnedSelection.SKIP)
                //       .Dispatch();
                //   }
                // }
                if (update.docChanged) {
                  // console.log(update.state.doc.toJSON())
                  app.cmd
                    .update(node, {
                      [CodeMirrorContentPath]: update.state.doc.toString(),
                    })
                    .Select(PinnedSelection.SKIP)
                    .Dispatch();
                }
                if (update.focusChanged && update.view.hasFocus) {
                  app.cmd.select(PointedSelection.NUll).Dispatch();
                }
                if (update.view.hasFocus) {
                  // console.log(update.view.hasFocus);
                }
              }
            },
          ),
          javascript({
            jsx: true,
            typescript: true,
          }),
        ],
        doc: code!,
      });

      return new EditorView({
        state,
        parent,
      });
    },
    [app, code, node],
  );

  return (
    <div
      onBeforeInput={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (isKeyHotkey("ctrl+s")(e)) {
          e.preventDefault();
        }
      }}
      onKeyUp={(e) => e.stopPropagation()}
    >
      <CarbonBlock node={node} ref={ref} />
    </div>
  );
};
