import React, { useRef } from "react";
import {
  CarbonBlock,
  CarbonChildren,
  CarbonNodeChildren,
  CarbonNodeContent,
  RendererProps,
  useSelectionHalo,
} from "@emrgen/carbon-core";

export const TableComp = (props: RendererProps) => {
  const { node } = props;
  const ref = useRef(null);
  const { attributes, SelectionHalo } = useSelectionHalo(props);

  // const { listeners } = useDragDropRectSelect({ node, ref });
  // console.log(node.textContent);
  // console.log(attributes);
  // console.log(node.attrs.node.emptyPlaceholder, node.name);

  return (
    <CarbonBlock node={node} ref={ref} custom={{ ...attributes }}>
      <table>
        <tbody>
          <CarbonChildren node={node} />
          {/* {SelectionHalo} */}
        </tbody>
      </table>
    </CarbonBlock>
  );
};

export const RowComp = (props: RendererProps) => {
  const { node } = props;
  const ref = useRef(null);
  const { attributes, SelectionHalo } = useSelectionHalo(props);

  // const { listeners } = useDragDropRectSelect({ node, ref });
  // console.log(node.textContent);
  // console.log(attributes);
  // console.log(node.attrs.node.emptyPlaceholder, node.name);

  return (
    <CarbonBlock node={node} ref={ref} custom={{ ...attributes }}>
      <CarbonChildren node={node} />
      {SelectionHalo}
    </CarbonBlock>
  );
};

export const ColumnComp = (props: RendererProps) => {
  const { node } = props;
  const ref = useRef(null);
  const { attributes, SelectionHalo } = useSelectionHalo(props);

  // const { listeners } = useDragDropRectSelect({ node, ref });
  // console.log(node.textContent);
  // console.log(attributes);
  // console.log(node.attrs.node.emptyPlaceholder, node.name);

  return (
    <CarbonBlock node={node} ref={ref} custom={{ ...attributes }}>
      <CarbonNodeContent node={node} />
      {SelectionHalo}
    </CarbonBlock>
  );
};
