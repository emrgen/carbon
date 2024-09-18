import { Optional } from "@emrgen/types";

const NullId = "0000000000";
const IdentityId = "0000000001";

export interface IntoNodeId {
  nodeId(): NodeId;
}

export class NodeId implements IntoNodeId {
  // root node id
  static ROOT = new NodeId("1111111111");

  static NULL = new NodeId(NullId);

  static IDENTITY = new NodeId(IdentityId);

  get isDefault() {
    return this.eq(NodeId.IDENTITY);
  }

  get isNull() {
    return this.eq(NodeId.NULL);
  }

  get key() {
    return this.id;
  }

  static deserialize(id: string): Optional<NodeId> {
    return new NodeId(id);
  }

  static create(id: string) {
    return new NodeId(id);
  }

  private constructor(readonly id: string) {}

  nodeId() {
    return this;
  }

  eq(other: NodeId) {
    return this.comp(other) === 0;
  }

  comp(other: NodeId) {
    return this.id.localeCompare(other.id);
  }

  clone() {
    return NodeId.create(this.id);
  }

  toString() {
    return this.id;
  }

  toJSON() {
    const { id } = this;
    return {
      id,
    };
  }

  serialize() {
    return this.id;
  }
}

export const NodeIdComparator = (a: NodeId, b: NodeId) => {
  return a.comp(b);
};

// @ts-ignore
window.NodeId = NodeId;
