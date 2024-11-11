import { Node } from "@emrgen/carbon-core";

export interface ShowContextMenuEvent {
  node: Node;
  event: MouseEvent;
  placement: "top" | "bottom" | "left" | "right" | "auto";
}