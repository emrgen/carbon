import React, { useCallback, useEffect, useRef } from "react";

import {
  ActionOrigin,
  CarbonBlock,
  CarbonNode,
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
  useCarbon,
} from "@emrgen/carbon-core";
import {
  useCombineConnectors,
  useConnectorsToProps,
  useDndRegion,
  useNonDraggable,
  useRectSelectionSurface
} from "@emrgen/carbon-dragon";
import { CarbonProps } from "@emrgen/carbon-attributes";
import { DocumentContext, usePlaceholder } from "../hooks";

export const DocumentComp = (props: RendererProps) => {
  const { node } = props;
  const { picture = {} } = node.attrs.node;

  const app = useCarbon();
  const {store} = app;

  const ref = useRef<HTMLElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dndRegion = useDndRegion({ node, ref });
  const nonDraggable = useNonDraggable({ node, ref });
  const selectionSurface = useRectSelectionSurface({ node, ref });


  useEffect(() => {
    app.emit("document:mounted", node);
  }, [app, node]);

  const placeholder = usePlaceholder(node);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const lastChild = node.lastChild as Node;
    const lastElement = app.store.element(lastChild?.id!);
    if (!lastChild) return;
    const bound = lastElement?.getBoundingClientRect();
    if (!bound) return;

    if (e.clientY > bound.bottom) {
      app.emit("document:cursor:hide");
      preventAndStop(e);
    }
  }, [node.lastChild, app]);

  const connectors = useConnectorsToProps(
    useCombineConnectors({
      listeners: {
        onMouseDown: handleMouseDown
      }
    }, selectionSurface, dndRegion, nonDraggable)
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      app.emit("document:cursor:show");
      const lastChildId = node.lastChild?.id;
      if (!lastChildId) return;
      const lastElement = app.store.element(lastChildId);
      const lastChild = app.store.get(lastChildId);
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
            app.tr.select(after, ActionOrigin.UserInput).dispatch();
          }
          return;
        }
        prevent(e);
        const at = Point.toAfter(lastChild.id);
        const section = app.schema.type("section").default();
        if (!section) return;
        const after = PinnedSelection.fromPin(Pin.toStartOf(section)!);
        app.tr
          .insert(at, section)
          .select(after, ActionOrigin.UserInput)
          .dispatch();
      }
    },
    [app, node]
  );

  // scroll to bottom on transaction if cursor is below the screen
  // useEffect(() => {
  //   const paddingBottom = 40;
  //   const onTransaction = (tr: any) => {
  //     const el = ref.current;
  //     if (!el) return;
  //     const { head } = app.selection.bounds(app.store);
  //     if (!head) return;
  //     const { bottom,  top } = head;
  //     // console.log(bottom, el.offsetHeight, el.scrollHeight, el.scrollTop);

  //     if (top < paddingBottom) {
  //       el.scrollTop = el.scrollTop + top - paddingBottom;
  //       return;
  //     }

  //     if (bottom > el.offsetHeight - paddingBottom) {
  //       el.scrollTop = el.scrollTop + bottom - el.offsetHeight + paddingBottom;
  //       return;
  //     }
  //   }
  //   app.on(EventsOut.selectionUpdated, onTransaction);
  //   return () => {
  //     app.off(EventsOut.selectionUpdated, onTransaction);
  //   };
  // }, [app, ref]);

  return (
    <DocumentContext document={node}>
      <div
        className="document-wrapper"
        ref={wrapperRef}
        onScroll={(e) => {
          app.onEvent(EventsIn.scroll, e as any)
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
            onMouseUp: handleClick,
            // onMouseDown: handleMouseDown,
            onScroll: (e) => {
              // console.log(e.target.scrollTop);
              app.emit(EventsIn.scroll, e as any)
            },
            onBlur: (e) => app.emit('document:blur', e as any),
            onFocus: (e) => app.emit('document:focus', e as any),
            className: 'carbon-document',
          }}
        >
          <CarbonNodeContent node={node} custom={placeholder} />
          <CarbonProps node={node} />
          <CarbonNodeChildren node={node} />
        </CarbonBlock>
      </div>
    </DocumentContext>
  );
};
