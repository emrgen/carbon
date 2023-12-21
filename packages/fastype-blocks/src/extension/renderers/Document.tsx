import { useCallback, useEffect, useRef } from "react";

import {
  ActionOrigin,
  CarbonBlock,
  CarbonNodeChildren,
  CarbonNodeContent,
  EventsIn,
  EventsOut,
  Node,
  Pin,
  PinnedSelection,
  Point,
  RendererProps,
  prevent,
  preventAndStop,
  useCarbon,
} from "@emrgen/carbon-core";
import {
  useCombineConnectors,
  useConnectorsToProps,
  useDndRegion,
  useDroppable,
  useNonDraggable,
  useRectSelectionSurface,
} from "@emrgen/carbon-dragon";
import { DocumentContext } from "@emrgen/carbon-blocks";

export const DocumentComp = (props: RendererProps) => {
  const { node } = props;
  // const { picture = {} } = node.properties.node;

  const app = useCarbon();

  const ref = useRef<HTMLElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useDroppable({ node, ref });

  const dndRegion = useDndRegion({ node, ref });
  const nonDraggable = useNonDraggable({ node, ref });
  const selectionSurface = useRectSelectionSurface({ node, ref });
  const connectors = useConnectorsToProps(
    useCombineConnectors(selectionSurface, dndRegion, nonDraggable)
  );

  useEffect(() => {
    app.emit("document:mounted", node);
  }, [app, node]);

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      const lastChild = node.lastChild as Node;
      const lastElement = app.store.element(lastChild?.id!);
      if (!lastChild) return;
      const bound = lastElement?.getBoundingClientRect();
      if (!bound) return;

      if (e.clientY > bound.bottom) {
        app.emit("document:cursor:hide");
        preventAndStop(e);
      }

      connectors.onMouseDown(e);
    },
    [node.lastChild, app, connectors]
  );

  const handleClick = useCallback(
    (e: MouseEvent) => {
      app.emit("document:cursor:show");

      const lastChild = node.lastChild as Node;
      const lastElement = app.store.element(lastChild?.id!);
      if (!lastChild) return;
      const bound = lastElement?.getBoundingClientRect();
      if (!bound) return;
      // console.log(bound, e, e.clientY, bound.bottom);

      if (e.clientY > bound.bottom) {
        if (lastChild.name === "section" && lastChild.isEmpty) {
          const textBlock = lastChild.find((n) => n.isTextBlock);
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
        const section = app.schema.type("section").default();
        if (!section) return;
        const after = PinnedSelection.fromPin(Pin.toStartOf(section)!);
        app.tr
          .Insert(at, section)
          .Select(after, ActionOrigin.UserInput)
          .Dispatch();
      }
    },
    [app, node.lastChild]
  );

  // scroll to bottom on transaction if cursor is below the screen
  useEffect(() => {
    const bottomPadding = 40;
    const onTransaction = (tr: any) => {
      const el = ref.current;
      if (!el) return;
      const { head } = app.selection.bounds(app.store);
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

  console.log(node.properties);

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
        <div className="carbon-document-picture">
          <div className="carbon-document-picture-overlay">
            <img src={picture.src} alt="document picture" />
          </div>
        </div>
      )}
      {!picture.src && (
          <div className="carbon-document-empty-picture"/>
        )} */}
        <CarbonBlock
          node={node}
          ref={ref}
          custom={{
            ...connectors,
            // onMouseUp: handleClick,
            onMouseDown: handleMouseDown,
            // onScroll: (e) => {
            //   app.emit(EventsIn.scroll, e as any);
            // },
            onBlur: (e) => app.emit("document:blur", e as any),
            onFocus: (e) => app.emit("document:focus", e as any),
            className: 'fastype-document',
          }}
        >
          <CarbonNodeContent node={node} />
          <CarbonNodeChildren node={node} />
        </CarbonBlock>
      </div>
    </DocumentContext>
  );
};
