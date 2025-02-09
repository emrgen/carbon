import {
  ActionOrigin,
  EventsIn,
  ModePath,
  Node,
  PagePropLink,
  Pin,
  PinnedSelection,
  Point,
  prevent,
  preventAndStop,
} from "@emrgen/carbon-core";
import {
  useCombineConnectors,
  useConnectorsToProps,
  useRectSelectionSurface,
} from "@emrgen/carbon-dragon-react";
import {
  CarbonBlock,
  CarbonNode,
  CarbonNodeChildren,
  RendererProps,
  useCarbon,
} from "@emrgen/carbon-react";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { DocumentContext, useNodeImage } from "../hooks";

export const PageComp = (props: RendererProps) => {
  const { node } = props;

  const app = useCarbon();
  const ref = useRef<Element>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectionSurface = useRectSelectionSurface({ node, ref });

  useEffect(() => {
    app.emit("page:mounted", node);
    return () => {
      app.emit("page:unmounted", node);
    };
  }, [app, node]);

  // hide cursor when it's below the last child of the page during mouse down
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const lastChild = node.lastChild as Node;
      const lastElement = app.store.element(lastChild?.id!);
      if (!lastChild) return;
      const bound = lastElement?.getBoundingClientRect();
      if (!bound) return;

      if (e.clientY > bound.bottom) {
        app.emit("page:cursor:hide");
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
    ),
  );

  const isEditable = useMemo(() => {
    return node.props.get<string>(ModePath, "view") === "edit";
  }, [node]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      app.emit("page:cursor:show");

      if (!isEditable) return;
      const lastChildId = node.lastChild?.id;
      if (!lastChildId) return;
      const lastElement = app.store.element(lastChildId);
      const lastChild = app.store.get(lastChildId);
      if (!lastChild) return;
      const bound = lastElement?.getBoundingClientRect();
      if (!bound) return;
      // console.info(bound, e, e.clientY, bound.bottom);

      if (e.clientY > bound.bottom) {
        if (lastChild.name === "paragraph" && lastChild.isEmpty) {
          const textBlock = lastChild.find((n) => n.isTextContainer);
          if (textBlock) {
            const after = PinnedSelection.fromPin(Pin.toStartOf(textBlock)!);
            if (after.eq(app.selection)) return;
            prevent(e);
            app.cmd.SelectBlocks([]).Select(after, ActionOrigin.UserInput).Dispatch();
          }
          return;
        }
        prevent(e);
        const at = Point.toAfter(lastChild.id);
        const paragraph = app.schema.type("paragraph").default();
        if (!paragraph) return;
        const after = PinnedSelection.fromPin(Pin.toStartOf(paragraph)!);
        app.cmd
          .SelectBlocks([])
          .Insert(at, paragraph)
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
    return node.links[PagePropLink] ?? Node.NULL;
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
        {image.src && (
          <div className="carbon-page-picture">
            <div className="carbon-page-picture-overlay">
              <img src={image.src} alt="page picture" />
            </div>
          </div>
        )}

        {!image.src && <div className="cdoc__empty-picture" />}

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
            // onBlur: (e) => app.emit('page:blur', e as any),
            // onFocus: (e) => app.emit('page:focus', e as any),
            className: "cpage",
            contentEditable: isEditable,
            suppressContentEditableWarning: true,
          }}
        >
          <CarbonNode node={node.child(0)!} custom={{ className: "cdoc__ti" }} />

          {!pageProps.eq(Node.NULL) && <CarbonNode node={pageProps} />}

          <CarbonNodeChildren node={node} wrap={false} />
        </CarbonBlock>
      </div>
    </DocumentContext>
  );
};
