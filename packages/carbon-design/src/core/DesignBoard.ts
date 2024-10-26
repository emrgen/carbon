import { Carbon, Node, NodeIdSet } from "@emrgen/carbon-core";
import { NodeTopicEmitter } from "@emrgen/carbon-core/src/core/NodeEmitter";

export class DesignBoard extends NodeTopicEmitter {
  activeNodes: NodeIdSet = new NodeIdSet();
  selectedNodes: NodeIdSet = new NodeIdSet();

  constructor(readonly app: Carbon) {
    super();
  }

  selectNodes(nodes: Node[]) {
    const nodeIds = NodeIdSet.fromIds(nodes.map((node) => node.id));
    const selected = nodeIds.sub(this.selectedNodes);
    const deselected = this.selectedNodes.sub(nodeIds);

    deselected.forEach((nodeId) => this.selectedNodes.remove(nodeId));
    selected.forEach((nodeId) => this.selectedNodes.add(nodeId));

    selected.forEach((nodeId) => {
      const node = this.app.store.get(nodeId);
      if (node) {
        this.emit(node, "select");
      }
    });
    deselected.forEach((nodeId) => {
      const node = this.app.store.get(nodeId);
      if (node) {
        this.emit(node, "deselect");
      }
    });
  }

  deselectNodes(nodes: Node[]) {
    const nodeIds = nodes.map((node) => node.id);
    const deselected = this.selectedNodes.sub(new NodeIdSet(nodeIds));
    deselected.forEach((nodeId) => this.selectedNodes.remove(nodeId));
    deselected.forEach((nodeId) => {
      const node = this.app.store.get(nodeId);
      if (node) {
        this.emit(node, "deselect");
      }
    });
  }

  activateNodes(nodes: Node[]) {
    const nodeIds = nodes.map((node) => node.id);
    const activated = this.activeNodes.sub(new NodeIdSet(nodeIds));
    const deactivated = this.activeNodes.sub(new NodeIdSet(nodeIds));

    deactivated.forEach((nodeId) => this.activeNodes.remove(nodeId));
    activated.forEach((nodeId) => this.activeNodes.add(nodeId));

    activated.forEach((nodeId) => {
      const node = this.app.store.get(nodeId);
      if (node) {
        this.emit(node, "activate");
      }
    });

    deactivated.forEach((nodeId) => {
      const node = this.app.store.get(nodeId);
      if (node) {
        this.emit(node, "deactivate");
      }
    });
  }

  deactivateNodes(nodes: Node[]) {
    const nodeIds = nodes.map((node) => node.id);
    const deactivated = this.activeNodes.sub(new NodeIdSet(nodeIds));
    deactivated.forEach((nodeId) => this.activeNodes.remove(nodeId));

    deactivated.forEach((nodeId) => {
      const node = this.app.store.get(nodeId);
      if (node) {
        this.emit(node, "deactivate");
      }
    });
  }
}