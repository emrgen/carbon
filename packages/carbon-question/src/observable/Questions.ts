import {CarbonEditor, Node, NodeId} from "@emrgen/carbon-core";
import {Optional} from "@emrgen/types";
import {isString} from "lodash";

export class Questions {
  app: CarbonEditor;
  nodes: Node[];

  static create(app: CarbonEditor, nodes: Node[]) {
    return new Questions(app, nodes);
  }

  constructor(app: CarbonEditor, nodes: Node[]) {
    this.app = app;
    this.nodes = nodes;
  }

  summary() {
    const summary = this.nodes.map((n) => this.status(n));
    return {
      questions: this.nodes.map((n) => this.status(n)),
      answeredCount: this.nodes.filter((n) => this.isAttempted(n)).length,
      correctCount: summary.map((s) => s.correct).filter(Boolean).length,
    };
  }

  status(id: string | NodeId | Node) {
    if (isString(id)) {
      id = NodeId.fromString(id);
    }

    let node: Optional<Node> = id as Optional<Node>;
    if (id instanceof NodeId) {
      node = this.nodes.find((n) => n.id.eq(id as NodeId));
    }

    const summary = this.app.service[node!.name].summary(node!) ?? {};

    return {
      types: node?.children.map((n) => n.name),
      isAttempted: this.isAttempted(node!),
      hasHints: this.hasHint(node!),
      hasExplanation: this.hasExplanation(node!),
      ...summary,
    };
  }

  private isAttempted(node: Node) {
    return this.app.service.question.isAttempted(node);
  }

  private hasHint(node: Node) {
    return !!node.children.find((n) => n.name === "hints")?.size;
  }

  private hasExplanation(node: Node) {
    return !!node.children.find((n) => n.name === "explanations")?.size;
  }
}
