import {useEffect, useMemo, useRef} from "react";
import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
  useCarbon,
  useSelectionHalo
} from "@emrgen/carbon-react";
import {useDragDropRectSelectHalo} from "@emrgen/carbon-dragon-react";
import {Carbon, ContenteditablePath, State, Node} from "@emrgen/carbon-core";

const makeEditable = (app: Carbon, node: Node) => {
  if (node.props.get(ContenteditablePath)) return
  app.cmd.Update(node.id, {
    [ContenteditablePath]: true,
  }).Dispatch()
}
const makeUneditable = (app: Carbon, node: Node) => {
  if (!node.props.get(ContenteditablePath)) {
    console.log('xxx [makeUneditable] already uneditable', node.props.get(ContenteditablePath), node.renderVersion, ContenteditablePath)
    return
  }
  app.cmd.Update(node.id, {
    [ContenteditablePath]: false,
  }).Dispatch()
}

export default function FrameComp(props: RendererProps) {
  const {node} = props;
  const ref = useRef(null);
  const {connectors, SelectionHalo} = useDragDropRectSelectHalo({node, ref})
  const app = useCarbon();

  // useEffect(() => {
  //   const onChange = (state: State) => {
  //     if (state.isSelectionChanged) {
  //       if (app.runtime.mousedown && !state.selection.tail.node.chain.some(n => n.eq(node))) {
  //         console.log('xxx [onChange]', state.isSelectionChanged)
  //         makeUneditable(app, node)
  //       }
  //     }
  //   }
  //
  //   app.on('changed', onChange)
  //   return () => {
  //     app.off('changed', onChange)
  //   }
  // }, [app, node]);

  const onMouseOver = () => {
    if (app.runtime.selecting && app.runtime.mousedown)  {
      console.log('xxx [selecting]')
    } else {
      console.log('xxx [not selecting]')
      makeEditable(app, node)
    }
  }

  const onMouseUp = (e) => {
    // e.preventDefault();
    // e.stopPropagation();
    setTimeout(() => {
      makeEditable(app, node)
    },0)
    // console.log('xxx [onMouseUp]', app.runtime.selecting, app.runtime.mousedown)
  }

  const onMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation()
    // makeUneditable(app, node)
    // console.log('xxx [onMouseDown]', app.runtime.selecting, app.runtime.mousedown)
  }

  return (
    <CarbonBlock node={node} ref={ref} custom={{...connectors, contentEditable: false}}>
      <div className={'frame-wrapper'} contentEditable={true} suppressContentEditableWarning={true}>
        <CarbonNodeContent node={node}/>
        <CarbonNodeChildren node={node}/>
        {SelectionHalo}
      </div>
    </CarbonBlock>
  );
}

const IsolateComp = (props: RendererProps) => {
  const {node} = props;
  const app = useCarbon();

  useEffect(() => {
    const onChange = (state: State) => {
      if (state.isSelectionChanged) {
        if (!state.selection.tail.node.chain.some(n => n.eq(node))) {
          console.log('xxx [onChange]', state.isSelectionChanged)
          makeUneditable(app, node)
        }
      }
    }

    app.on('changed', onChange)
    return () => {
      app.off('changed', onChange)
    }
  }, [app, node]);

  const onMouseOver = () => {
    if (app.runtime.selecting && app.runtime.mousedown)  {
      console.log('xxx [selecting]')
    } else {
      console.log('xxx [not selecting]')
      makeEditable(app, node)
    }
  }

  return (
    <>
      {props.children}
      <div className={'frame-bound'} onMouseOver={onMouseOver}></div>
    </>
  )
}


