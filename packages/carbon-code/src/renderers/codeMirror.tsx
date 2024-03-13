import {useEffect, useRef, useState} from "react";
import {useCombineConnectors, useConnectorsToProps, useDragDropRectSelect} from "@emrgen/carbon-dragon-react";
import {CarbonBlock, CarbonNode, RendererProps, useSelectionHalo} from "@emrgen/carbon-react";
import {EditorView, basicSetup, } from "codemirror"
import {javascript} from "@codemirror/lang-javascript"
import {EditorState} from "@codemirror/state";
import {lineNumbers} from "@codemirror/view";

export const CodeMirrorComp = (props: RendererProps) => {
  const {node} = props;
  const ref = useRef(null);

  const code = node.props.get('remote/state/codemirror', '')


  console.log(basicSetup)

  useEffect(() => {
    if (!ref.current) return;

    const state = EditorState.create({
      extensions: [
        basicSetup,
        lineNumbers({}),
        // javascript({
        //   jsx: true,
        //   typescript: true,
        // })
      ],
      doc: code!,
    })

    let editor = new EditorView({
      state,
      parent: ref.current!,
    })

    return () => {
      editor.destroy()
    }

  }, []);


  return (
    <CarbonBlock node={node} ref={ref}>
    </CarbonBlock>
  )
}
