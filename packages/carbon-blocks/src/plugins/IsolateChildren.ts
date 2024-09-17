import {
  BeforePlugin,
  EventContext,
  EventHandlerMap,
  preventAndStopCtx,
} from "@emrgen/carbon-core";

// do not let the cursor move between the title and the content
export class IsolateChildren extends BeforePlugin {
  name = "isolateChildren";

  keydown(): EventHandlerMap {
    return {
      backspace: this.backspace,
      left: this.left,
      right: this.right,
      shiftLeft: this.shiftLeft,
      shiftRight: this.shiftRight,
    };
  }

  backspace = (ctx: EventContext<KeyboardEvent>) => {
    if (!ctx.app.state.blockSelection.isEmpty) return;

    if (!ctx.selection.isCollapsed) {
      return;
    }
    this.preventAtContentStart(ctx);
  };

  left = (ctx: EventContext<KeyboardEvent>) => {
    if (!ctx.app.state.blockSelection.isEmpty) return;

    if (!ctx.selection.isCollapsed) {
      return;
    }
    this.preventAtContentStart(ctx);
  };

  right = (ctx: EventContext<KeyboardEvent>) => {
    if (!ctx.app.state.blockSelection.isEmpty) return;

    if (!ctx.selection.isCollapsed) {
      return;
    }
    // this.preventAtTitleEnd(ctx);
  };

  shiftLeft = (ctx: EventContext<KeyboardEvent>) => {
    if (!ctx.app.state.blockSelection.isEmpty) return;
    this.preventAtContentStart(ctx);
  };

  shiftRight = (ctx: EventContext<KeyboardEvent>) => {
    if (!ctx.app.state.blockSelection.isEmpty) return;
    this.preventAtTitleEnd(ctx);
  };

  preventAtContentStart(e) {
    if (this.isAtStartOfChildren(e)) {
      console.log("xxxxxxxxxxxxxxxxx");
      preventAndStopCtx(e);
    }
  }

  preventAtTitleEnd(e) {
    if (this.isAtEndOfTitle(e)) {
      // preventAndStopCtx(e)
    }
  }

  isAtStartOfChildren(e) {
    const { app } = e;
    const isolating = this.isolatingNode(e);
    if (!isolating) return false;
    const firstChild = isolating.child(1);
    if (!firstChild) return false;
    const ret = app.selection.head.isAtStartOfNode(firstChild);
    return ret;
  }

  isAtEndOfTitle(e) {
    const { app } = e;
    const isolating = this.isolatingNode(e);
    console.log(isolating);
    if (!isolating) return false;
    const titleNode = isolating.firstChild;
    if (!titleNode) return false;
    const ret = app.selection.head.isAtEndOfNode(titleNode);
    return ret;
  }

  isolatingNode(e) {
    const { app } = e;
    const { selection } = app;
    const { head } = selection;
    return head.node.closest((n) => n.type.spec.isolateContent);
  }
}
