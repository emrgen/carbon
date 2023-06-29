import React, { useRef } from "react";
import {
  CarbonBlock,
  RendererProps,
  preventAndStop,
  useCarbon,
  useNodeChange,
  useSelectionHalo,
} from "@emrgen/carbon-core";

export default function ImageComp(props: RendererProps) {
  const { node } = props;
  const app = useCarbon();
  const { SelectionHalo, attributes } = useSelectionHalo(props);
  const ref = useRef<HTMLDivElement>(null);

  const handleClick = (e) => {
    preventAndStop(e);

    app.emit("show:options:menu", node.id, ref.current?.getBoundingClientRect());

    app.tr
      .selectNodes([node.id])
      // .updateAttrs(node.id, {
      //   html: {
      //     style: {
      //       justifyContent: "start",
      //     },
      //   },
      // })

      .dispatch();
  };

  return (
    <CarbonBlock {...props} custom={{ ...attributes }}>
      <div className="image-container" onClick={handleClick} ref={ref}>
        <img src={node.attrs.node.src} alt="" />
        <div>&shy;</div>
        {SelectionHalo}
      </div>
    </CarbonBlock>
  );
}
