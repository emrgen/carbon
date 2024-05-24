import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
  useCarbon,
  useSelectionHalo,
} from "@emrgen/carbon-react";
import {
  useCombineConnectors,
  useConnectorsToProps,
  useDragDropRectSelect,
} from "@emrgen/carbon-dragon-react";
import { Mark, prevent, preventAndStop, State } from "@emrgen/carbon-core";

export const CommentEditorComp = (props: RendererProps) => {
  const { node } = props;
  const ref = useRef(null);
  const app = useCarbon();
  const [marks, setMarks] = useState<string[]>([]);

  const selection = useSelectionHalo(props);
  const dragDropRect = useDragDropRectSelect({ node, ref });
  const connectors = useConnectorsToProps(
    useCombineConnectors(dragDropRect, selection),
  );

  const handleInsertNode = useCallback(
    (e) => {
      prevent(e);
      const { lastChild } = node;
      if (lastChild && lastChild.name === "section" && lastChild.isEmpty) {
        app.cmd.selection.collapseAtStartOf(lastChild).dispatch();
        return;
      }

      app.cmd.inserter.appendDefault(node, "section").dispatch();
    },
    [app, node],
  );

  const toggleName = useCallback(
    (name: string) => (e) => {
      preventAndStop(e);
      // TODO
      // find the last child
      // if its a nestable toggle it
      // else insert a new item with that name
      app.cmd.nestable.toggle(name).dispatch();
    },
    [app],
  );

  const toggleMark = useCallback(
    (mark: Mark) => (e) => {
      preventAndStop(e);
      const { blockSelection, selection } = app.state;
      if (blockSelection.isEmpty && selection.isCollapsed) {
        app.cmd.marks.toggle(mark)?.dispatch();
      } else {
        app.cmd.formatter.toggle(mark)?.dispatch();
      }
    },
    [app],
  );

  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const onChange = (state: State) => {
      if (state.blockSelection.isActive) {
        setIsFocused(false);
      } else {
        const { head, tail } = state.selection;
        if (
          head.node.parents.some((p) => p.eq(node)) &&
          tail.node.parents.some((p) => p.eq(node))
        ) {
          setIsFocused(true);
        } else {
          setIsFocused(false);
        }
      }

      setMarks(() => state.marks.toArray().map((mark) => mark.name));
    };

    app.on("changed", onChange);
    return () => {
      app.off("changed", onChange);
    };
  }, [app, node]);

  const toolbar = useMemo(
    () => (
      <div className={"carbon-comment-editor-toolbar"} data-focused={isFocused}>
        <button onMouseDown={toggleName("h1")} disabled={!isFocused}>
          H1
        </button>
        <button onMouseDown={toggleName("h2")} disabled={!isFocused}>
          H2
        </button>
        <button onMouseDown={toggleName("h3")} disabled={!isFocused}>
          H3
        </button>
        <button onMouseDown={toggleName("bulletList")} disabled={!isFocused}>
          -
        </button>
        <button onMouseDown={toggleName("numberList")} disabled={!isFocused}>
          1.
        </button>
        <button onMouseDown={toggleName("todo")} disabled={!isFocused}>
          [ ]
        </button>
        &nbsp; · &nbsp;
        <button
          disabled={!isFocused}
          onMouseDown={toggleMark(Mark.BOLD)}
          className={"inline-style-bold"}
          data-active={marks.includes(Mark.BOLD.name)}
        >
          B
        </button>
        <button
          disabled={!isFocused}
          onMouseDown={toggleMark(Mark.ITALIC)}
          className={"inline-style-italic"}
          data-active={marks.includes(Mark.ITALIC.name)}
        >
          I
        </button>
        <button
          disabled={!isFocused}
          onMouseDown={toggleMark(Mark.UNDERLINE)}
          className={"inline-style-underline"}
          data-active={marks.includes(Mark.UNDERLINE.name)}
        >
          U
        </button>
        <button
          disabled={!isFocused}
          onMouseDown={toggleMark(Mark.STRIKE)}
          className={"inline-style-strike"}
          data-active={marks.includes(Mark.STRIKE.name)}
        >
          S
        </button>
        <button
          disabled={!isFocused}
          onMouseDown={toggleMark(Mark.CODE)}
          className={"inline-style-code"}
          data-active={marks.includes(Mark.CODE.name)}
        >
          {"{}"}
        </button>
      </div>
    ),
    [isFocused, marks, toggleMark, toggleName],
  );

  return (
    <div
      className="carbon-comment-editor"
      contentEditable={false}
      suppressContentEditableWarning={true}
      key={node.key}
    >
      {toolbar}
      <CarbonBlock {...props} ref={ref} custom={{ ...connectors }}>
        <CarbonNodeContent node={node} />
        <CarbonNodeChildren node={node} />
      </CarbonBlock>
      {selection.SelectionHalo}
    </div>
  );
};
