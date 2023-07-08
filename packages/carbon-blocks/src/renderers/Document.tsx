import React, { useRef } from "react";

import {
  ActionOrigin,
  CarbonBlock,
  CarbonChildren,
  CarbonNodeChildren,
  CarbonNodeContent,
  Pin,
  PinnedSelection,
  RendererProps,
  useCarbon,
} from "@emrgen/carbon-core";
import CarbonLink from "./CarbonLink";
import { Point } from "@emrgen/carbon-core";

export const DocumentComp = (props: RendererProps) => {
  const { node } = props;
  const app = useCarbon();

  const ref = useRef<HTMLElement>(null);
  // const dndRegion = useDndRegion({ node, ref });
  // const selectionSurface = useRectSelectionSurface({ node, ref });
  // const connectors = useConnectorsToProps(useCombineConnectors(
  // 	selectionSurface,
  // 	dndRegion
  // ));

  const onClick = (e) => {
    const { bottom } = ref.current!.getBoundingClientRect() ?? {};
    const { pageY } = e;
    // if (pageY > bottom - 200) {
    //   e.stopPropagation();
    //   e.preventDefault();
    //   const { lastChild } = node;

    //   if (lastChild?.isContainerBlock && lastChild?.isEmpty) {
    //     const after = PinnedSelection.fromPin(Pin.toStartOf(lastChild)!);
    //     if (app.selection.eq(after)) return;

    //     app.tr.select(after).dispatch();
    //     return;
    //   }

    //   const block = app.schema.type("section")?.default();
    //   if (!block) return;
    //   const after = PinnedSelection.fromPin(Pin.toStartOf(block)!);
    //   const at = Point.toAfter(lastChild!.id);
    //   app.tr
    //     .insert(at, block)
    //     .select(after, ActionOrigin.UserInput)
    //     .dispatch();
    // }
  };

  const onMouseDown = (e) => {
    const { bottom } = ref.current!.getBoundingClientRect() ?? {};
    const { pageY } = e;
    // if (pageY > bottom - 200) {
    //   e.stopPropagation();
    //   e.preventDefault();
    // }
  }

  // console.log(connectors)
  return (
    <CarbonBlock node={node} ref={ref} custom={{ onClick, onMouseDown }}>
      <CarbonNodeContent node={node} custom={{ placeholder: "Untitled" }} />
      <CarbonNodeChildren node={node} />
    </CarbonBlock>
  );
};
