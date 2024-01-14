import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  CarbonPlaceholder,
  RendererProps,
  useCarbon,
  useSelectionHalo
} from "@emrgen/carbon-react";
import {useCombineConnectors, useConnectorsToProps, useDragDropRectSelect} from "@emrgen/carbon-dragon-react";

export const CommentEditorComp = (props: RendererProps) => {
  const {node} = props;
  const ref = useRef(null);
  const app = useCarbon();

  const selection = useSelectionHalo(props);
  const dragDropRect = useDragDropRectSelect({node, ref});
  const connectors = useConnectorsToProps(
    useCombineConnectors(dragDropRect, selection)
  );

  const handleInsertNode = useCallback((e) => {
    prevent(e);
    const {lastChild} = node;
    if (lastChild && lastChild.name === 'section' && lastChild.isEmpty) {
      app.cmd.selection.collapseAtStartOf(lastChild).dispatch();
      return
    }

    app.cmd.inserter.append(node, 'section').dispatch();
  }, [app, node])

  const toggleName = useCallback((name: string) => (e) => {
    preventAndStop(e);
    // TODO
    // find the last child
    // if its a nestable toggle it
    // else insert a new item with that name
    app.cmd.nestable.toggle(name).dispatch();
  }, []);

  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const onChange = (state: State) => {
      console.log('changed')
      if (state.blockSelection.isActive) {
        setIsFocused(false);
      } else {
        const {head, tail} = state.selection;
        console.log(head.node.parents.some(p => p.eq(node)), tail.node.parents.some(p => p.eq(node)))
        if (head.node.parents.some(p => p.eq(node)) && tail.node.parents.some(p => p.eq(node))) {
          setIsFocused(true);
        } else {
          setIsFocused(false);
        }
      }
    }

    app.on('changed', onChange);
    return () => {
      app.off('changed', onChange);
    }
  }, [node]);

  useEffect(() => {
    console.log('isFocused', isFocused)
  }, [isFocused]);

  const toolbar = useMemo(() => (
    <div className={'carbon-comment-editor-toolbar'} data-focused={isFocused}>
      <button onMouseDown={toggleName('h1')} disabled={!isFocused}>H1</button>
      <button onMouseDown={toggleName('h2')} disabled={!isFocused}>H2</button>
      <button onMouseDown={toggleName('h3')} disabled={!isFocused}>H3</button>
      <button onMouseDown={toggleName('bulletedList')} disabled={!isFocused}>-</button>
      <button onMouseDown={toggleName('numberedList')} disabled={!isFocused}>1.</button>
      <button onMouseDown={toggleName('todo')} disabled={!isFocused}>[]</button>
      &nbsp; · &nbsp;
      <button disabled={!isFocused}>B</button>
      <button disabled={!isFocused}>I</button>
      <button disabled={!isFocused}>U</button>
    </div>
  ), [isFocused]);

  return (
    <div className="carbon-comment-editor" contentEditable={false} suppressContentEditableWarning={true} key={node.key}>
      {toolbar}
      <CarbonBlock {...props} ref={ref} custom={{...connectors}}>
        <CarbonNodeContent node={node}/>
        <CarbonNodeChildren node={node}/>
        {selection.SelectionHalo}
      </CarbonBlock>
    </div>
  )
}

import {prevent, preventAndStop, State} from "@emrgen/carbon-core";
