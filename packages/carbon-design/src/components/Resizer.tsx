import { Node } from "@emrgen/carbon-core";
import {
  MouseEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useBoard } from "../hook/useBoard";

interface ElementTransformerProps {
  node: Node;
  children?: ReactNode[];
}

export const ElementTransformer = (props: ElementTransformerProps) => {
  const { children, node } = props;
  const board = useBoard();
  const [selected, setSelected] = useState(false);
  const [active, setActive] = useState(false);

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      board.selectNodes([node]);
    },
    [board, node],
  );

  useEffect(() => {
    const onSelect = () => setSelected(true);
    const onDeselect = () => setSelected(false);
    const onActive = () => setActive(true);
    const onInactive = () => setActive(false);

    board.on(node.id, "select", onSelect);
    board.on(node.id, "deselect", onDeselect);
    board.on(node.id, "activate", onActive);
    board.on(node.id, "deactivate", onInactive);

    return () => {
      board.off(node.id, "select", onSelect);
      board.off(node.id, "deselect", onDeselect);
      board.off(node.id, "activate", onActive);
      board.off(node.id, "deactivate", onInactive);
    };
  }, [board, node.id]);

  const attrs = useMemo(() => {
    const classes = ["carbon-transformer"];
    if (selected) classes.push("de-element--selected");
    if (active) classes.push("de-element--active");

    return {
      className: classes.join(" "),
      onMouseDown: handleMouseDown,
    };
  }, [selected, active, handleMouseDown]);

  return <div {...attrs}>{children}</div>;
};