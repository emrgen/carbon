import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CarbonBlock, RendererProps, useCarbon } from "@emrgen/carbon-react";
import { basicSetup, EditorView } from "codemirror";
import { EditorState } from "@codemirror/state";
import { lineNumbers, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { javascript } from "@codemirror/lang-javascript";
import { Optional } from "@emrgen/types";
import { PointedSelection } from "@emrgen/carbon-core";

export const CodeMirrorComp = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();
  const ref = useRef<any>(null);
  const [editor, setEditor] = useState<Optional<EditorView>>(null);

  const code = useMemo(() => {
    return node.props.get("remote/state/codemirror", "");
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
                if (!update.view.hasFocus) {
                  app.cmd
                    .update(node, {
                      remote: {
                        state: {
                          codemirror: update.state.doc.toString(),
                        },
                      },
                    })
                    .Dispatch();
                }
                if (update.docChanged) {
                  // console.log(update.state.doc.toJSON())
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

  useEffect(() => {
    if (ref.current) {
      setEditor((editor: Optional<EditorView>) => {
        if (editor) {
          return editor;
        }

        return moundEditor(ref.current);
      });
    }
  }, [editor, moundEditor, ref]);

  return <CarbonBlock node={node} ref={ref} />;
};
