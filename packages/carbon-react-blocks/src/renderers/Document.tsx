import React, { useCallback, useEffect, useRef } from "react";

import {
  ActionOrigin,
  EventsIn,
  Node,
  Pin,
  PinnedSelection,
  Point,
  prevent,
  preventAndStop,
} from "@emrgen/carbon-core";
import { DocumentContext } from "../hooks";
import {CarbonBlock, CarbonNodeChildren, CarbonNodeContent, useCarbon, RendererProps} from "@emrgen/carbon-react";
import {
  useCombineConnectors,
  useConnectorsToProps,
  useDndRegion,
  useNonDraggable,
  useRectSelectionSurface
} from "@emrgen/carbon-dragon-react";

export const DocumentComp = (props: RendererProps) => {
  const { node } = props;
  // const  = node.props.get("document");

  const app = useCarbon();
  const {store} = app;

  const ref = useRef<Element>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dndRegion = useDndRegion({ node, ref });
  const nonDraggable = useNonDraggable({ node, ref });
  const selectionSurface = useRectSelectionSurface({ node, ref });


  useEffect(() => {
    app.emit("document:mounted", node);
  }, [app, node]);

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
        const section = app.schema.type("section").default();
        if (!section) return;
        const after = PinnedSelection.fromPin(Pin.toStartOf(section)!);
        app.tr
          .Insert(at, section)
          .Select(after, ActionOrigin.UserInput)
          .Dispatch();
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
  //     const { head } = react.selection.bounds(react.store);
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
  //   react.on(EventsOut.selectionUpdated, onTransaction);
  //   return () => {
  //     react.off(EventsOut.selectionUpdated, onTransaction);
  //   };
  // }, [react, ref]);

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
          ref={ref as any}
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
          <CarbonNodeContent node={node} />
          {/*<CarbonProps node={node} />*/}
          <CarbonNodeChildren node={node} />
        </CarbonBlock>
      </div>
    </DocumentContext>
  );
};
