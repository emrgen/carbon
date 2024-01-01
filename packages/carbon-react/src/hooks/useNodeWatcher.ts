import {Node} from "@emrgen/carbon-core";
import {useEffect, useRef} from "react";

export type Comparer<T> = (after: T, before: T) => boolean;
export type Watcher<T> = (after: T, before: T) => void;

// watch node and call onChange with current and previous node values
export const useNodeWatcher = (onChange: Watcher<Node>, node: Node, condition?: Comparer<Node>) => {
  const prev = useRef<Node>(node);
  const current = useRef<Node>(node);

  useEffect(() => {
    prev.current = current.current;
    current.current = node;
    if (condition && !condition(current.current, prev.current)) {
      return;
    }
    onChange(current.current, prev.current)
  }, [condition, node, onChange])
}

// watch node contentVersion and call onChange with current and previous node values
export const useNodeContentWatcher = (onChange: Watcher<Node>, node: Node) => {
  useNodeWatcher(onChange, node, (after, before) => after.contentVersion !== before.contentVersion)
}

export const useNodePropertyWatcher = (onChange: Watcher<Node>, node: Node) => {
  useNodeWatcher(onChange, node, (after, before) => after.contentVersion === before.contentVersion && after.renderVersion !== before.renderVersion)
}
