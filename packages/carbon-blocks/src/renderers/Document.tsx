import { useCallback, useRef } from "react";

import {
  ActionOrigin,
  CarbonBlock,
  CarbonNode,
  CarbonNodeChildren,
  CarbonNodeContent,
  EventsIn,
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
  useNonDraggable,
  useRectSelectionSurface,
} from "@emrgen/carbon-dragon";
import { usePlaceholder } from "../hooks/usePlaceholder";
import { renderAttr } from "../components/renderAttrs";
import { hasAttrs, nodeAttrs } from "../../../carbon-attributes/src/utils";
import { CarbonAttributes } from "@emrgen/carbon-attributes";

export const DocumentComp = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();

  const ref = useRef<HTMLElement>(null);
  const dndRegion = useDndRegion({ node, ref });
  const nonDraggable = useNonDraggable({ node, ref });
  const selectionSurface = useRectSelectionSurface({ node, ref });
  const connectors = useConnectorsToProps(
    useCombineConnectors(selectionSurface, dndRegion, nonDraggable)
  );

  const placeholder = usePlaceholder(node);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const lastChild = node.lastChild as Node;
      const lastElement = app.store.element(lastChild?.id!);
      if (!lastChild) return;
      const bound = lastElement?.getBoundingClientRect();
      if (!bound) return;
      console.log(bound, e, e.clientY, bound.bottom);

      if (e.clientY > bound.bottom) {
        if (
          lastChild.isContainerBlock &&
          !lastChild.isAtom &&
          lastChild.isEmpty
        ) {
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
        console.log("add new child");
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
    [node.lastChild, app.store, app.schema, app.tr, app.selection]
  );

  return (
    <div
      className="document-wrapper"
      onScroll={(e) => app.onEvent(EventsIn.scroll, e as any)}
    >
      <CarbonBlock
        node={node}
        ref={ref}
        custom={{ ...connectors, onMouseUp: handleClick }}
      >
        <CarbonNodeContent node={node} custom={placeholder} />
        <CarbonAttributes node={node} />
        <CarbonNodeChildren node={node} />
      </CarbonBlock>
    </div>
  );
};
