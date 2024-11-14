import { NodeId, NodePlugin, NodeSpec, Node } from "@emrgen/carbon-core";
import { Optional } from "@emrgen/types";
import { EdgePartsPath, SourceNodeIdPath, SourcePositionPath, TargetNodeIdPath } from "../constants";
import { EdgeData, EdgePart, Position } from "../types";

declare module "@emrgen/carbon-core" {
  export interface Service {
    cgEdge: {
      sourceNode(edge: Node): Optional<Node>;
      targetNode(edge: Node): Optional<Node>;
      sourcePosition(edge: Node): Optional<Position>;
      targetPosition(edge: Node): Optional<Position>;
      edgeParts(edge: Node): EdgePart[];
      data(edge: Node): Optional<EdgeData>;
    };
  }
}

export class Edge extends NodePlugin {
  name = 'cgEdge';

  spec(): NodeSpec {
    return {
      group: 'edge',
      props: {
        remote: {
          state: {
            styles: {},
            source: {
              node: NodeId.NULL,
              position: {
                x: 0,
                y: 0
              }
            },
            target: {
              node: NodeId.NULL,
              position: {
                x: 0,
                y: 0
              }
            },
            // edge parts are multi segment curves
            parts: [] satisfies EdgePart[]
          }
        }
      }
    }
  }

  services(): Record<string, Function> {
    return {
      sourceNode: (edge: Node) => {
        const sourceId = edge.props.get(SourceNodeIdPath, "");
        return this.nodeFromIdString(sourceId);
      },
      targetNode: (edge: Node) => {
        const targetId = edge.props.get(TargetNodeIdPath, "");
        return this.nodeFromIdString(targetId);
      },
      sourcePosition: (edge: Node) => {
        return edge.props.get(SourcePositionPath, "");
      },
      targetPosition: (edge: Node) => {
        return edge.props.get(SourcePositionPath, "");
      },
      edgeParts: (edge: Node) => {
        return edge.props.get(EdgePartsPath, []);
      },
      data(edge: Node) {
        const source = edge.props.get(SourceNodeIdPath, "");
        const target = edge.props.get(TargetNodeIdPath, "");
        if (!source || !target) {
          return null;
        }
        const sourceId = NodeId.deserialize(source);
        const targetId = NodeId.deserialize(target);

        const sourcePosition = this.sourcePosition(edge);
        const targetPosition = this.targetPosition(edge);

        if (!sourcePosition || !targetPosition) {
          return null;
        }

        const parts = this.edgeParts(edge);

        return {
          name: edge.name,
          source: {
            node: sourceId,
            position: sourcePosition,
          },
          target: {
            node: targetId,
            position: targetPosition,
          },
          parts,
        };
      }

    }
  }

  nodeFromIdString(nodeId: string): Optional<Node> {
    if (!nodeId) {
      return null;
    }

    const sourceNodeId = NodeId.deserialize(nodeId);
    return this.app.store.get(sourceNodeId);
  }
}
