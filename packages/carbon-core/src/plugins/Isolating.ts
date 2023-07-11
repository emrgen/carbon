import { AfterPlugin, EventContext, EventHandlerMap } from "../core";


export const createIsolatingPlugin = () => {
  new IsolatingPlugin();
};

// handle caret movement around isolating nodes
export class IsolatingPlugin extends AfterPlugin {

  name = "isolating";

  // needs to be more than KeyboardPrevent.priority
  priority = 10 ** 4 + 600;

  keydown(): EventHandlerMap {
    return {
      left: (e: EventContext<KeyboardEvent>) => {
        // let a = e.app.cmd.transform.delete()

        if (!e.selection.isCollapsed) {
          e.app.tr.select(e.selection.collapseToStart());
          return;
        }
        this.preventAtStart(e);
      },
      right: (e: EventContext<KeyboardEvent>) => {
        if (!e.selection.isCollapsed) {
          e.app.tr.select(e.selection.collapseToEnd());
          return;
        }
        this.preventAtEnd(e);
      },
      shiftLeft: e => {
        if (e.app.blockSelection.size) return
        this.preventAtStart(e);
      },
      shiftRight: e => {
        if (e.app.blockSelection.size) return
        this.preventAtEnd(e);
      },
      backspace: e => {
        if (e.app.blockSelection.size) return
        this.preventAtStartCollapsed(e);
      },
      delete: e => {
        if (e.app.blockSelection.size) return
        this.preventAtEndCollapsed(e);
      },
      shiftBackspace: e => {
        if (e.app.blockSelection.size) return
        this.preventAtStart(e);
      },
      shiftDelete: e => {
        if (e.app.blockSelection.size) return
        this.preventAtEnd(e);
      }
    };
  }

  collapseToHead(e) {

  }

  preventAtStart(e) {
    if (this.isAtStart(e)) {
      this.prevent(e);
    }
  }

  preventAtStartCollapsed(e) {
    console.log('XXX');
    
    if (this.isAtStart(e) && this.isCollapsed(e)) {
      this.prevent(e);
    }
  }

  preventAtStartExpanded(e) {
    if (this.isAtStart(e) && !this.isCollapsed(e)) {
      this.prevent(e);
    }
  }

  preventAtEnd(e) {
    if (this.isAtEnd(e)) {
      this.prevent(e);
    }
  }

  preventAtEndCollapsed(e) {
    if (this.isAtEnd(e) && this.isCollapsed(e)) {
      this.prevent(e);
    }
  }

  preventAtEndExpanded(e) {
    if (this.isAtEnd(e) && !this.isCollapsed(e)) {
      this.prevent(e);
    }
  }

  isCollapsed(e) {
    return e.app.selection.isCollapsed;
  }

  prevent(e) {
    e.event.stopPropagation();
    e.event.preventDefault();
    e.preventDefault();
    e.stopPropagation();
  }

  isAtStart(e) {
    const { app } = e;
    const isolating = this.isolatingNode(e);
    if (!isolating) return false;
    const ret = app.selection.head.isAtStartOfNode(isolating);
    return ret;
  }

  isAtEnd(e) {
    const { app } = e;
    const isolating = this.isolatingNode(e);
    if (!isolating) return false;
    const ret = app.selection.head.isAtEndOfNode(isolating);
    return ret;
  }

  isolatingNode(e) {
    const { app } = e;
    const { selection } = app;
    const { head } = selection;
    return head.node.closest(n => n.isIsolating);
  }

}
