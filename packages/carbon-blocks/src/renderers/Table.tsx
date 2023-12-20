import {
  CarbonBlock,
  CarbonChildren,
  CarbonNodeContent,
  Node,
  Point,
  RendererProps,
  preventAndStop,
  useCarbon,
  useSelectionHalo,
} from "@emrgen/carbon-core";
import { useCombineConnectors, useConnectorsToProps, useDragDropRectSelect } from "@emrgen/carbon-dragon";
import { createContext, useContext, useEffect, useRef, useState } from "react";

const TableContext = createContext<Node>(null!);
const useTable = () => useContext(TableContext);

export const TableComp = (props: RendererProps) => {
  const { node } = props;

  const ref = useRef<HTMLElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  const app = useCarbon();

  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  const selection = useSelectionHalo(props);
  const dragDropRect = useDragDropRectSelect({ node, ref });
  const connectors = useConnectorsToProps(
    useCombineConnectors(dragDropRect, selection)
  );

  useEffect(() => {
    if (!tableRef.current) return;
    setWidth(tableRef.current ? tableRef.current.offsetWidth : 0);
    setHeight(tableRef.current ? tableRef.current.offsetHeight : 0);
    // console.log('width', ref.current ? ref.current.offsetWidth : 0);
  }, [node.version]);

  // const { listeners } = useDragDropRectSelect({ node, ref });
  // console.log(node.textContent);
  // console.log(attributes);
  // console.log(node.attrs.node.emptyPlaceholder, node.name);

  const handleAddRow = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    preventAndStop(e);
    const at = Point.toAfter(node.lastChild!.id);
    const columns = node.firstChild!.children.map((column) => {
      return app.schema.type(column.name).default();
    }) as Node[];
    const row = app.schema.type("row").create(columns)!;
    app.tr
      .Insert(at, row)
      .Update(node.id, { node: { rows: node.size + 1 } })
      .Dispatch();
  };

  const handleAddColumns = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    preventAndStop(e);
    const { tr } = app;
    const row = node.firstChild!;
    node.children.forEach((row) => {
      const at = Point.toAfter(row.lastChild!.id);
      const column = app.schema.type("column").default()!;
      tr.Insert(at, column);
    });

    tr.Update(node.id, { node: { columns: row.size + 1 } });
    tr.Dispatch();
  };

  return (
    <CarbonBlock node={node} ref={ref} custom={connectors}>
      <TableContext.Provider value={node}>
        <table ref={tableRef}>
          <tbody>
            <CarbonChildren node={node} />
          </tbody>
        </table>
        {selection.isSelected && (
          <div
            className="carbon-halo-container"
            style={{ width: width + "px", height: height + "px" }}
          >
            {selection.SelectionHalo}
          </div>
        )}
        {!!width && (
          <div
            className="add_table__row"
            style={{ width: width + "px" }}
            onClick={handleAddRow}
            onMouseDown={preventAndStop}
          />
        )}
        {!!height && (
          <div
            className="add_table__columns"
            style={{ height: height + "px", left: width + "px" }}
            onClick={handleAddColumns}
            onMouseDown={preventAndStop}
          />
        )}
      </TableContext.Provider>
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
      {/* <div className="update_table__row" /> */}
      {/* {SelectionHalo} */}
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
