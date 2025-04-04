import { DocumentContext } from "@emrgen/carbon-blocks-react";
import {
  ActionOrigin,
  EventsIn,
  EventsOut,
  Node,
  Pin,
  PinnedSelection,
  Point,
  prevent,
  preventAndStop,
} from "@emrgen/carbon-core";
import {
  useCombineConnectors,
  useConnectorsToProps,
  useDndRegion,
  useDroppable,
  useRectSelectionSurface,
} from "@emrgen/carbon-dragon-react";
import {
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
  useCarbon,
} from "@emrgen/carbon-react";
import { useCallback, useEffect, useRef } from "react";

export const DocumentComp = (props: RendererProps) => {
  const { node } = props;
  // const { picture = {} } = node.props.node;

  const app = useCarbon();

  const ref = useRef<HTMLElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useDroppable({ node, ref });

  const dndRegion = useDndRegion({ node, ref });
  const selectionSurface = useRectSelectionSurface({ node, ref });
  const connectors = useConnectorsToProps(
    useCombineConnectors(selectionSurface, dndRegion),
  );

  useEffect(() => {
    app.emit("page:mounted", node);
  }, [app, node]);

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      const lastChild = node.lastChild as Node;
      const lastElement = app.store.element(lastChild?.id!);
      if (!lastChild) return;
      const bound = lastElement?.getBoundingClientRect();
      if (!bound) return;

      if (e.clientY > bound.bottom) {
        app.emit("page:cursor:hide");
        preventAndStop(e);
      }

      connectors.onMouseDown(e);
    },
    [node.lastChild, app, connectors],
  );

  const handleClick = useCallback(
    (e: MouseEvent) => {
      app.emit("page:cursor:show");

      const lastChild = node.lastChild as Node;
      const lastElement = app.store.element(lastChild?.id!);
      if (!lastChild) return;
      const bound = lastElement?.getBoundingClientRect();
      if (!bound) return;
      // console.log(bound, e, e.clientY, bound.bottom);

      if (e.clientY > bound.bottom) {
        if (lastChild.name === "paragraph" && lastChild.isEmpty) {
          const textBlock = lastChild.find((n) => n.isTextContainer);
          if (textBlock) {
            const after = PinnedSelection.fromPin(Pin.toStartOf(textBlock)!);
            if (after.eq(app.selection)) return;
            prevent(e);
            app.tr.Select(after, ActionOrigin.UserInput).Dispatch();
          }
          return;
        }
        prevent(e);
        const at = Point.toAfter(lastChild.id);
        const paragraph = app.schema.type("paragraph").default();
        if (!paragraph) return;
        const after = PinnedSelection.fromPin(Pin.toStartOf(paragraph)!);
        app.tr
          .Insert(at, paragraph)
          .Select(after, ActionOrigin.UserInput)
          .Dispatch();
      }
    },
    [app, node.lastChild],
  );

  // scroll to bottom on transaction if cursor is below the screen
  useEffect(() => {
    const bottomPadding = 40;
    const onTransaction = (tr: any) => {
      const el = ref.current;
      if (!el) return;
      const { head } = app.selection.bounds(app.store, app.dom);
      if (!head) return;
      const { bottom, top } = head;
      // console.log(bottom, el.offsetHeight, el.scrollHeight, el.scrollTop);

      if (top < bottomPadding) {
        el.scrollTop = el.scrollTop + top - bottomPadding;
        return;
      }

      if (bottom > el.offsetHeight - bottomPadding) {
        el.scrollTop = el.scrollTop + bottom - el.offsetHeight + bottomPadding;
        return;
      }
    };
    app.on(EventsOut.selectionUpdated, onTransaction);
    return () => {
      app.off(EventsOut.selectionUpdated, onTransaction);
    };
  }, [app, ref]);

  return (
    <DocumentContext document={node}>
      <div
        className="document-wrapper"
        ref={wrapperRef}
        onScroll={(e) => {
          app.onEvent(EventsIn.scroll, e as any);
        }}
      >
        {/* {picture.src && (
        <div className="carbon-page-picture">
          <div className="carbon-page-picture-overlay">
            <img src={picture.src} alt="page picture" />
          </div>
        </div>
      )}
      {!picture.src && (
          <div className="carbon-page-empty-picture"/>
        )} */}
        <CarbonBlock
          node={node}
          ref={ref as any}
          custom={{
            ...connectors,
            // onMouseUp: handleClick,
            onMouseDown: handleMouseDown,
            // onScroll: (e) => {
            //   react.emit(EventsIn.scroll, e as any);
            // },
            onBlur: (e) => app.emit("page:blur", e as any),
            onFocus: (e) => app.emit("page:focus", e as any),
            className: "fastype-page",
          }}
        >
          <CarbonNodeContent node={node} />
          <CarbonNodeChildren node={node} />
        </CarbonBlock>
      </div>
    </DocumentContext>
  );
};
