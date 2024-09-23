import { NodeId } from "./NodeId";
import { NodeProps } from "./NodeProps";
import { NodeIdMap } from "./BTree";

export class Decorations {
  decorations = new NodeIdMap<NodeProps>();

  emptyProps(): NodeProps {
    throw new Error("Method not implemented.");
  }

  add<T>(nodeId: NodeId, path: string, value: T) {
    const props = this.decorations.get(nodeId) ?? this.emptyProps();
    props.set(path, value);
    this.decorations.set(nodeId, props);
  }

  remove(nodeId: NodeId) {
    this.decorations.delete(nodeId);
  }

  get<T>(nodeId: NodeId, path: string, defaultValue: T) {
    return this.decorations.get(nodeId)?.get<T>(path) ?? defaultValue;
  }
}
