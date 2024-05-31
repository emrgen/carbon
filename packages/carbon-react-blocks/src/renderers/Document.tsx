import React, { useCallback, useEffect, useMemo, useRef } from "react";

import {
  ActionOrigin,
  EventsIn,
  ModePath,
  Node,
  Pin,
  PinnedSelection,
  Point,
  prevent,
  preventAndStop,
  PropLink,
} from "@emrgen/carbon-core";
import { DocumentContext, useNodeImage } from "../hooks";
import {
  CarbonBlock,
  CarbonNode,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
  useCarbon,
} from "@emrgen/carbon-react";
import {
  useCombineConnectors,
  useConnectorsToProps,
  useDndRegion,
  useNonDraggable,
  useRectSelectionSurface,
} from "@emrgen/carbon-dragon-react";

export const DocumentComp = (props: RendererProps) => {
  const { node } = props;
  // const  = node.props.get("document");

  const app = useCarbon();
  const { store } = app;

  const ref = useRef<Element>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dndRegion = useDndRegion({ node, ref });
  const nonDraggable = useNonDraggable({ node, ref });
  const selectionSurface = useRectSelectionSurface({ node, ref });

  useEffect(() => {
    app.emit("document:mounted", node);
  }, [app, node]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const lastChild = node.lastChild as Node;
      const lastElement = app.store.element(lastChild?.id!);
      if (!lastChild) return;
      const bound = lastElement?.getBoundingClientRect();
      if (!bound) return;

      if (e.clientY > bound.bottom) {
        app.emit("document:cursor:hide");
        preventAndStop(e);
      }
    },
    [node.lastChild, app],
  );

  const connectors = useConnectorsToProps(
    useCombineConnectors(
      {
        listeners: {
          onMouseDown: handleMouseDown,
        },
      },
      selectionSurface,
      dndRegion,
      nonDraggable,
    ),
  );

  const isEditable = useMemo(
    () => node.props.get<string>(ModePath, "view") === "edit",
    [node],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      app.emit("document:cursor:show");
      if (!isEditable) return;
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
            app.tr
              .SelectBlocks([])
              .Select(after, ActionOrigin.UserInput)
              .Dispatch();
            console.log("######################");
          }
          return;
        }
        prevent(e);
        const at = Point.toAfter(lastChild.id);
        const section = app.schema.type("section").default();
        if (!section) return;
        const after = PinnedSelection.fromPin(Pin.toStartOf(section)!);
        app.tr
          .SelectBlocks([])
          .Insert(at, section)
          .Select(after, ActionOrigin.UserInput)
          .Dispatch();
      }
    },
    [app, isEditable, node.lastChild?.id],
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

  const image = useNodeImage(node);

  const handleToggleMode = useCallback(() => {
    app.cmd
      .Update(node.id, {
        [ModePath]: isEditable ? "view" : "edit",
      })
      .Dispatch();
  }, [app, isEditable, node]);

  const pageProps = useMemo(() => {
    return node.links[PropLink] ?? Node.NULL;
  }, [node]);

  return (
    <DocumentContext document={node}>
      <div
        className="document-wrapper"
        ref={wrapperRef}
        onScroll={(e) => {
          app.onEvent(EventsIn.scroll, e as any);
        }}
      >
        <button className={"document-mode-toggle"} onClick={handleToggleMode}>
          Toggle Mode
        </button>
        {image.src && (
          <div className="carbon-page-picture">
            <div className="carbon-page-picture-overlay">
              <img src={image.src} alt="page picture" />
            </div>
          </div>
        )}

        {!image.src && <div className="carbon-document-empty-picture" />}

        <CarbonBlock
          node={node}
          ref={ref as any}
          custom={{
            ...connectors,
            onMouseUp: handleClick,
            // onMouseDown: handleMouseDown,
            onScroll: (e) => {
              // console.log(e.target.scrollTop);
              app.emit(EventsIn.scroll, e as any);
            },
            // onBlur: (e) => app.emit('document:blur', e as any),
            // onFocus: (e) => app.emit('document:focus', e as any),
            className: "carbon-document",
            contentEditable: isEditable,
            suppressContentEditableWarning: true,
          }}
        >
          <CarbonNodeContent node={node} />
          {!pageProps.eq(Node.NULL) && <CarbonNode node={pageProps} />}
          {/*<CarbonProps node={node} />*/}
          <CarbonNodeChildren node={node} />
        </CarbonBlock>
      </div>
    </DocumentContext>
  );
};
