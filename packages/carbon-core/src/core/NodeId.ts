import { Optional } from "@emrgen/types";

const NullId = "0000000000";
const IdentityId = "0000000001";

export interface IntoNodeId {
  nodeId(): NodeId;
}

export class NodeId implements IntoNodeId {
  // root node id
  static ROOT = new NodeId("9999999999");

  static NULL = new NodeId(NullId);

  static IDENTITY = new NodeId(IdentityId);

  static SKIP: NodeId = NodeId.fromString("0000000002");

  get isDefault() {
    return this.eq(NodeId.IDENTITY);
  }

  get isNull() {
    return this.eq(NodeId.NULL);
  }

  get key() {
    return this.id;
  }

  static deserialize(id: string): NodeId {
    return new NodeId(id);
  }

  static fromString(id: string) {
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
    try {
      return this.id.localeCompare(other.id);
    } catch (e) {
      throw new Error(`NodeId: ${this.id} and ${other.id} are not comparable`);
    }
  }

  clone() {
    return NodeId.fromString(this.id);
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
