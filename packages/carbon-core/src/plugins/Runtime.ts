import {
  BeforePlugin,
  Carbon,
  CarbonMouseEvent,
  EventContext,
  EventHandlerMap,
  Node,
} from "@emrgen/carbon-core";
import { Optional } from "@emrgen/types";

export class Runtime extends BeforePlugin {
  name = "runtime";

  constructor() {
    super();
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onSelectionChange = this.onSelectionChange.bind(this);
    this.onMouseOver = this.onMouseOver.bind(this);
    this.onMouseOut = this.onMouseOut.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
  }

  handlers(): EventHandlerMap {
    return {
      mouseUp: this.onMouseUp,
      mouseDown: this.onMouseDown,
      mouseOver: this.onMouseOver,
      mouseOut: this.onMouseOut,
      // mouseMove: this.onMouseMove,
      selectionchange: this.onSelectionChange,
    };
  }

  get isMouseDown(): boolean {
    return this.mouseDownNode;
  }

  get mouseDownNode(): boolean {
    return this.state.get("mouseDownNode");
  }

  get mouseOverNode(): Optional<Node> {
    return this.state.get("mouseOverNode");
  }

  get isSelecting(): boolean {
    return this.state.get("isSelecting");
  }

  onWindowMouseUp() {
    // window.removeEventListener("mouseup", this.onMouseUp);
  }

  onSelectionChange(ctx: EventContext<MouseEvent>) {
    if (ctx.app.runtime.mousedown) {
      ctx.app.runtime.selecting = true;
      // this.state.set("isSelecting", true);
    }
  }

  onMouseMove(ctx: EventContext<CarbonMouseEvent>) {
    if (this.isSelecting && this.targetNode(ctx)?.isIsolate) {
      // preventAndStopCtx(ctx)
    }
  }

  onMouseUp(ctx: EventContext<CarbonMouseEvent>) {
    ctx.app.runtime.mousedown = false;
    ctx.app.runtime.selecting = false;
    // this.setNode("mouseDownNode",  null);
    // this.state.set("mousedown", false);
    // this.state.set("isSelecting", false);
  }

  onMouseDown(ctx: EventContext<CarbonMouseEvent>) {
    ctx.app.runtime.mousedown = true;
    // this.state.set("mousedown", true)
    // const targetNode = this.targetNode(ctx);
    // // console.debug('[mouse down]', targetNode?.chain.map(n => n.name).join(' > '));
    // this.setNode("mouseDownNode",  targetNode);

    // window.addEventListener("mouseup", this.onMouseUp);
  }

  onMouseOver(ctx: EventContext<CarbonMouseEvent>) {
    // const targetNode = this.targetNode(ctx);
    // console.debug('[mouse over]', targetNode?.chain.map(n => n.name).join(' > '));
    // preventAndStopCtx(ctx);
    // this.setNode("mouseOverNode", targetNode);
  }

  onMouseOut(ctx: EventContext<CarbonMouseEvent>) {
    // const targetNode = this.targetNode(ctx);
    // console.debug('[mouse out]', targetNode?.chain.map(n => n.name).join(' > '));
  }

  onMouseIn() {
    console.log("onMouseIn");
  }

  setNode(key: string, node: Optional<Node>) {
    this.state.set(key, node);
  }

  targetNode(ctx: EventContext<CarbonMouseEvent>): Optional<Node> {
    const { event, app } = ctx;
    const { nativeEvent } = event;
    const { target } = nativeEvent;
    return this.resolveNode(app, target as HTMLElement);
  }

  resolveNode(app: Carbon, target: HTMLElement): Optional<Node> {
    return app.store.resolve(target as HTMLElement, 0).node;
  }
}
