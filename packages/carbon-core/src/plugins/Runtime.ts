import {BeforePlugin, Carbon, CarbonMouseEvent, EventContext, EventHandlerMap, Node} from "@emrgen/carbon-core";
import {Optional} from "@emrgen/types";

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
  }

  handlers(): EventHandlerMap {
    return {
      mouseUp: this.onMouseUp,
      mouseDown: this.onMouseDown,
      mouseOver: this.onMouseOver,
      mouseOut: this.onMouseOut,
      mouseIn: this.onMouseIn,
      selectionchange: this.onSelectionChange,
    }
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

  onWindowMouseUp() {
    // window.removeEventListener("mouseup", this.onMouseUp);
  }

  onSelectionChange(ctx: EventContext<MouseEvent>) {
    // console.log("[before]: onSelectionChange", this.mouseOverNode);
  }

  onMouseMove() {
    // console.log("onMouseMove");
  }

  onMouseUp() {
    this.setNode("mouseDownNode",  null);
    this.state.set("mousedown", false);
  }

  onMouseDown(ctx: EventContext<CarbonMouseEvent>) {
    this.state.set("mousedown", true)
    const targetNode = this.resolveNode(ctx);
    // console.debug('[mouse down]', targetNode?.chain.map(n => n.name).join(' > '));
    this.setNode("mouseDownNode",  targetNode);
  }

  onMouseOver(ctx: EventContext<CarbonMouseEvent>) {
    const targetNode = this.resolveNode(ctx);
    console.debug('[mouse over]', targetNode?.chain.map(n => n.name).join(' > '));
    this.setNode("mouseOverNode", targetNode);
  }

  onMouseOut(ctx: EventContext<MouseEvent>) {
    if (this.mouseOverNode?.eq(ctx.targetNode)) {
      this.setNode("mouseOverNode", null);
    }
  }

  onMouseIn() {
    console.log("onMouseIn");
  }

  setNode(key: string, node: Optional<Node>) {
    this.state.set(key, node);
  }

  resolveNode(ctx: EventContext<CarbonMouseEvent>): Optional<Node> {
    const {event, app} = ctx;
    const {nativeEvent} = event;
    const {target} = nativeEvent;
    // console.log(nativeEvent)
    const node = app.store.resolve(target as HTMLElement);
    return app.store.resolve(target as HTMLElement);
  }

}
