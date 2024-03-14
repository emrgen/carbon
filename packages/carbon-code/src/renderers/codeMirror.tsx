import {useEffect, useMemo, useRef} from "react";
import {CarbonBlock, RendererProps, useCarbon} from "@emrgen/carbon-react";
import {basicSetup, EditorView,} from "codemirror"
import {EditorState} from "@codemirror/state";
import {lineNumbers, ViewPlugin, ViewUpdate} from "@codemirror/view";

export const CodeMirrorComp = (props: RendererProps) => {
  const {node} = props;
  const ref = useRef(null);
  const app = useCarbon();

  const code = useMemo(() => {
    return node.props.get('remote/state/codemirror', '')
  }, [node]);

  useEffect(() => {
    if (!ref.current) return;

    const state = EditorState.create({
      extensions: [
        basicSetup,
        lineNumbers({}),
        ViewPlugin.fromClass(class {
          constructor(view) {
          }

          update(update: ViewUpdate) {
            if (!update.view.hasFocus) {
              app.cmd.update(node, {
                remote: {
                  state: {
                    codemirror: update.state.doc.toString()
                  }
                }
              }).Dispatch()
            }
            if (update.docChanged) {
              // console.log(update.state.doc.toJSON())
            }
          }

        })
        // javascript({
        //   jsx: true,
        //   typescript: true,
        // })
      ],
      doc: code!,
    });

    let editor = new EditorView({
      state,
      parent: ref.current!,
    })

    console.log(editor)

    return () => {
      editor.destroy()
    }

  }, [code]);

  return (
    <CarbonBlock node={node} ref={ref}/>
  )
}
