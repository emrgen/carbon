import {CarbonBlock, CarbonNodeChildren, CarbonNodeContent, RendererProps, useCarbon} from "@emrgen/carbon-react";
import {useCallback, useRef} from "react";
import {
  ActionOrigin,
  Carbon,
  CollapsedPath,
  ContenteditablePath,
  Node,
  Pin,
  PinnedSelection,
  Point,
  TxType
} from "@emrgen/carbon-core";
import {MdOutlineKeyboardArrowDown, MdOutlineKeyboardArrowRight} from "react-icons/md";
import {useDragDropRectSelectHalo} from "@emrgen/carbon-dragon-react";
import {Optional} from "@emrgen/types";

const isParentContentEditable = (el: HTMLElement) => {
  let node: Optional<HTMLElement> = el;
  while (node) {
    console.log(el, el.getAttribute('contentEditable'))
    if (el.getAttribute('contentEditable') === 'true') return true;
    node = node.parentNode as HTMLElement;
  }

  return false;
}

const isContentEditable = (node: Node, el: HTMLElement) => {
  const editable = node.props.get<boolean>(ContenteditablePath);
  return editable || editable === undefined && isParentContentEditable(el);
}

export default function HintComp(props: RendererProps) {
  const { node } = props;
  const app = useCarbon();
  const isCollapsed = node.isCollapsed;

  const ref = useRef(null);
  const {connectors, SelectionHalo} = useDragDropRectSelectHalo({node, ref})

  // insert a new section as child of this collapsible
  const handleInsert = useCallback((app: Carbon) => {
    const section = app.schema.type("section").default()!;
    const at = Point.toAfter(node.child(0)!.id);

    app.cmd
      .Insert(at, section)
      .Select(
        PinnedSelection.fromPin(Pin.toStartOf(section)!),
        ActionOrigin.UserInput
      )
      .Dispatch();
  }, [node]);

  // toggle collapsed state
  const handleToggle = useCallback((app: Carbon) => {
    const {cmd, selection} = app;
    cmd
      .Update(node.id, {
        [CollapsedPath]: !isCollapsed,
      })
    if (!isCollapsed) {
      // const {start, end} = selection;
      // const startInTitle = start.node.closest(n => !!node.firstChild?.eq(n));
      // const endInTitle = end.node.closest(n => !!node.firstChild?.eq(n));
      cmd.Select(PinnedSelection.fromPin(Pin.toStartOf(node.child(0)!)!));
    }

    cmd.WithType(TxType.OneWay)
    cmd.Dispatch();
  }, [node, isCollapsed]);

  const handleToggleInViewerMove = useCallback((e) => {
    // if (!isContentEditable(node, e.target)) {
    //   e.stopPropagation();
    //   e.preventDefault();
    //   handleToggle(app);
    // }
  },[handleToggle, app]);

  const beforeContent = (
    <div
      className="carbon-hint__control"
      contentEditable="false"
      suppressContentEditableWarning
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={() => handleToggle(app)}
    >
      {isCollapsed ? (
        <MdOutlineKeyboardArrowRight />
      ) : (
        <MdOutlineKeyboardArrowDown />
      )}
    </div>
  );

  return (
    <CarbonBlock
      {...props}
      custom={{ "data-collapsed": isCollapsed, ...connectors }}
      ref={ref}
    >
      <CarbonNodeContent
        node={node}
        beforeContent={beforeContent}
        key={node.renderVersion}
        wrapper={{ onMouseDown: handleToggleInViewerMove }}
      />

      {node.size > 1 ? (
        <CarbonNodeChildren node={node} />
      ) : (
        <div
          className="hint-insert-section"
          contentEditable="false"
          suppressContentEditableWarning
          onClick={() => handleInsert(app)}
        >
          Click to insert.
        </div>
      )}

      {SelectionHalo}
    </CarbonBlock>
  );
}
