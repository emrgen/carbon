import {
  ActionOrigin,
  AfterPlugin, ContenteditablePath,
  EventContext,
  EventHandlerMap, LocalContenteditablePath,
  Pin,
  PinnedSelection, SuppressContenteditableWarningPath,
  UserSelectPath
} from "../core";
import {preventAndStopCtx, Node} from "@emrgen/carbon-core";
import {Optional} from "@emrgen/types";

export const createIsolatingPlugin = () => {
  new IsolateSelectionPlugin();
};

// handle caret movement around isolating nodes
export class IsolateSelectionPlugin extends AfterPlugin {
  name = "isolating";

  // needs to be more than KeyboardPrevent.priority
  priority = 10 ** 4 + 800;

  isMouseDown = false;
  isSelecting = false;

  startIsolate: Optional<Node>;
  selection: Optional<PinnedSelection>;

  handlers(): EventHandlerMap {
    return {
      selectionchange: (ctx: EventContext<Event>) => {
        const targetNode = ctx.targetNode;
        if (targetNode?.isIsolate) {
          // preventAndStopCtx(ctx);
        }
      },
      // TODO: may be mark all the isolating nodes as non-focusable
      // selecting within a isolating node
      _selectionchange: (ctx: EventContext<Event>) => {
        const {selection, cmd} = ctx;
        const {start, end, head, tail} = selection;
        if (selection.isCollapsed) return;

        if (this.isMouseDown) {
          this.isSelecting = true;
          return;
        }

        const headIsolating = head.node.closest((n) => n.isIsolate);
        const tailIsolating = tail.node.closest((n) => n.isIsolate);
        console.log(tailIsolating, headIsolating)
        if (!headIsolating && !tailIsolating) return;

        if (headIsolating && tailIsolating && !headIsolating.eq(tailIsolating)) {
          preventAndStopCtx(ctx);
          // keep the selection outside the child isolating node
          if (headIsolating.parents.some((n) => n.eq(tailIsolating))) {
            if (selection.isForward) {
              const prevFocusable = headIsolating.prev((n) => n.isFocusable, {
                skip: n => n.isIsolate
              });
              if (prevFocusable) {
                const headPin = Pin.toEndOf(prevFocusable)!;
                const newSelection = PinnedSelection.create(tail, headPin, ActionOrigin.UserInput);
                cmd.Select(newSelection, ActionOrigin.UserInput).Dispatch();
              }
            } else {
              const nextFocusable = headIsolating.next((n) => n.isFocusable, {
                skip: n => n.isIsolate
              });
              if (nextFocusable) {
                const headPin = Pin.toStartOf(nextFocusable)!;
                const newSelection = PinnedSelection.create(tail, headPin, ActionOrigin.UserInput);
                cmd.Select(newSelection, ActionOrigin.UserInput).Dispatch();
              }
            }
            return;
          }

          // keep the selection inside the tail isolating node
          preventAndStopCtx(ctx);
          if (selection.isForward) {
            const headPin = Pin.toEndOf(tailIsolating)!;
            const newSelection = PinnedSelection.create(tail, headPin, ActionOrigin.UserInput);
            cmd.Select(newSelection, ActionOrigin.UserInput).Dispatch();
          } else {
            const headPin = Pin.toStartOf(tailIsolating)!;
            const newSelection = PinnedSelection.create(tail, headPin, ActionOrigin.UserInput);
            cmd.Select(newSelection, ActionOrigin.UserInput).Dispatch();
          }
          return;
        }


        // keep the selection inside the tail isolating node
        if (tailIsolating && !headIsolating) {
          preventAndStopCtx(ctx);
          if (selection.isForward) {
            const headPin = Pin.toEndOf(tailIsolating)!;
            const newSelection = PinnedSelection.create(tail, headPin);
            cmd.Select(newSelection).Dispatch();
          } else {
            const headPin = Pin.toStartOf(tailIsolating)!;
            const newSelection = PinnedSelection.create(tail, headPin);
            cmd.Select(newSelection).Dispatch();
          }
          return;
        }

        // NOTE: because document is isolating, this code block is not needed
      },
      mouseDown: (ctx) => {
        this.isMouseDown = true;
        const onMouseUp = () => {
          this.isMouseDown = false;
          document.removeEventListener('mouseup', onMouseUp);
        }

        document.addEventListener('mouseup', onMouseUp);

        this.startIsolate = ctx.targetNode?.closest((n) => n.isIsolate);
        this.selection = ctx.app.selection.clone();
        ctx.app.runtime.selectionchange = false;
      },
      _mouseMove: (ctx) => {
        return
        console.log('-------------------------------------', this.isMouseDown)
        // console.log(ctx.event.nativeEvent)
        // if (this.isMouseDown && !this.isSelecting) {
        //   this.isSelecting = true
        //   return;
        // }

        if (!this.isMouseDown) {
          return;
        }


        const {targetNode} = ctx;
        const {selection} = ctx;
        const {tail, head} = selection;

        // const tailIsolating = this.tailIsolate(ctx);
        const {startIsolate: tailIsolating} = this
        const headIsolating = targetNode?.closest((n) => n.isIsolate);
        if (!headIsolating) return;
        if (!tailIsolating) return;

        // return;

        console.log(headIsolating.name, tailIsolating.name)

         // if (targetNode && headIsolating?.eq(targetNode) ||
        if (!headIsolating.eq(tailIsolating)) {
          ctx.app.runtime.skipSelectionSync = true;
          console.log('================================', ctx.event)
          preventAndStopCtx(ctx)

          if (selection.isForward || (selection.isCollapsed && headIsolating.after(tail.node))) {
            const prevFocusable = headIsolating.prev((n) => {
              return n.isFocusable && !!n.closest((n) => n.isIsolate)?.eq(tailIsolating);
            });

            const topHeadIsolate = headIsolating.chain.find(n => {
              return n.isIsolate && n.parents.some(p => p.eq(tailIsolating))
            })

            if (topHeadIsolate) {
              // return;
            }

            if (prevFocusable) {
              const headPin = Pin.toEndOf(prevFocusable)!;
              const newSelection = PinnedSelection.create(tail, headPin, ActionOrigin.UserInput);
              if (selection.eq(newSelection)) return;
              ctx.cmd.Select(newSelection, ActionOrigin.UserInput).Dispatch();
              return
            }
          }

          if (selection.isBackward || (selection.isCollapsed && headIsolating.before(tail.node))) {
            const nextFocusable = headIsolating.next((n) => {
              return n.isFocusable && !!n.closest((n) => n.isIsolate)?.eq(tailIsolating);
            });

            if (nextFocusable) {
              const headPin = Pin.toStartOf(nextFocusable)!;
              const newSelection = PinnedSelection.create(tail, headPin, ActionOrigin.UserInput);
              if (selection.eq(newSelection)) return;
              ctx.cmd.Select(newSelection, ActionOrigin.UserInput).Dispatch();
              return
            }
          }

          // TODO: select within the isolating node when the mouse goes outside
           console.log('SELECT WITHIN ISOLATE')

          return;
        }
      },
      mouseUp: (ctx) => {
        if (!ctx.app.runtime.selectionchange) {
          return;
        }
        console.log('mouse up ----------------------', PinnedSelection.fromDom(ctx.app.store)?.toString())
        const selection = PinnedSelection.fromDom(ctx.app.store);
        if (!selection) return;

        const {head, tail} = selection;
        const headIsolating = head.node.closest((n) => n.isIsolate);
        const tailIsolating = tail.node.closest((n) => n.isIsolate);
        if (!headIsolating || !tailIsolating) return;

        if (headIsolating.eq(tailIsolating)) {
          console.log('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx')
          ctx.cmd.Select(selection, ActionOrigin.UserInput).Dispatch();
          // ctx.app.runtime.mousedown = false;
          return;
        }


        if (selection.isForward) {
          const prevFocusable = headIsolating.prev((n) => {
            return n.isFocusable && !!n.closest((n) => n.isIsolate)?.eq(tailIsolating);
          });

          if (prevFocusable) {
            const headPin = Pin.toEndOf(prevFocusable)!;
            const newSelection = PinnedSelection.create(tail, headPin, ActionOrigin.UserInput);
            ctx.cmd.Select(newSelection, ActionOrigin.UserInput).Dispatch();
            return;
          }
        }

        if (selection.isBackward) {
          const nextFocusable = headIsolating.next((n) => {
            return n.isFocusable && !!n.closest((n) => n.isIsolate)?.eq(tailIsolating);
          });

          if (nextFocusable) {
            const headPin = Pin.toStartOf(nextFocusable)!;
            const newSelection = PinnedSelection.create(tail, headPin, ActionOrigin.UserInput);
            ctx.cmd.Select(newSelection, ActionOrigin.UserInput).Dispatch();
            return;
          }
        }
      }
    };
  }

  keydown(): EventHandlerMap {
    return {
      down: (e: EventContext<KeyboardEvent>) => {
        console.log('down isolating')
      },
      up: (e: EventContext<KeyboardEvent>) => {

      },
      shiftUp: (e: EventContext<KeyboardEvent>) => {
        if (e.app.selection.isBlock) return;
        const { selection, currentNode } = e;
        const { head, tail } = selection;

        // cursor can move to the previous focusable node
        const prevFocusable = head.node.prev((n) => n.isFocusable);
        if (!prevFocusable) return;

        // but only if it's not inside same isolating node as the current one
        const isolating = head.node.closest((n) => n.isIsolate);
        if (isolating && !prevFocusable.parents.some((n) => n.eq(isolating))) {
          this.prevent(e);
          const firstFocusable = currentNode.find((n) => n.isFocusable);
          if (firstFocusable) {
            const headPin = Pin.toStartOf(firstFocusable)!;
            const newSelection = PinnedSelection.create(tail, headPin, ActionOrigin.UserInput);
            e.cmd.Select(newSelection, ActionOrigin.UserInput).Dispatch();
          }
          return;
        }

        // or only if the current node is inside the previous isolating node
        const prevIsolating = prevFocusable.closest((n) => n.isIsolate);
        if (prevIsolating && !currentNode.parents.some((n) => n.eq(prevIsolating))) {
          this.prevent(e);
          return;
        }
      },
      shiftDown: (e: EventContext<KeyboardEvent>) => {
        if (e.app.selection.isBlock) return;
        const { selection } = e;
        const { head, tail } = selection;

        // cursor can move to the next focusable node
        const nextFocusable = head.node.next((n) => n.isFocusable);
        if (!nextFocusable) return;

        // but only if it's not inside same isolating node as the current one
        const isolating = head.node.closest((n) => n.isIsolate);
        if (isolating && !nextFocusable.parents.some((n) => n.eq(isolating))) {
          this.prevent(e);
          const lastFocusable = isolating.find((n) => n.isFocusable, { direction: 'backward' });
          if (!lastFocusable?.eq(head.node)) return;

          const headPin = Pin.toEndOf(isolating)!;
          if (headPin) {
            const newSelection = PinnedSelection.create(tail, headPin, ActionOrigin.UserInput);
            e.cmd.Select(newSelection, ActionOrigin.UserInput).Dispatch();
          }
          return;
        }

        // or only if the current node is inside the next isolating node
        const nextIsolating = nextFocusable.closest((n) => n.isIsolate);
        if (
          nextIsolating &&
          !head.node.parents.some((n) => n.eq(nextIsolating))
        ) {
          this.prevent(e);
          return;
        }
      },
      left: (e: EventContext<KeyboardEvent>) => {
        if (e.app.selection.isBlock) return;

        if (!e.selection.isCollapsed) {
          e.cmd.Select(e.selection.collapseToStart());
          return;
        }
        this.preventAtStart(e);
      },
      right: (e: EventContext<KeyboardEvent>) => {
        if (e.app.selection.isBlock) return;

        if (!e.selection.isCollapsed) {
          e.cmd.Select(e.selection.collapseToEnd());
          return;
        }
        this.preventAtEnd(e);
      },
      shiftLeft: (e) => {
        if (e.app.selection.isBlock) return;
        this.preventAtStart(e);
      },
      shiftRight: (e) => {
        if (e.app.selection.isBlock) return;
        this.preventAtEnd(e);
      },
      backspace: (e) => {
        if (e.app.selection.isBlock) return;
        this.preventAtStartCollapsed(e);
      },
      delete: (e) => {
        if (e.app.selection.isBlock) return;
        this.preventAtEndCollapsed(e);
      },
      shiftBackspace: (e) => {
        if (e.app.selection.isBlock) return;
        this.preventAtStart(e);
      },
      shiftDelete: (e) => {
        if (e.app.selection.isBlock) return;
        this.preventAtEnd(e);
      },
    };
  }

  collapseToHead(e) {}

  preventAtStart(e) {
    if (this.isAtStart(e)) {
      this.prevent(e);
    }
  }

  preventAtStartCollapsed(e) {
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
    const isolating = this.headIsolate(e);
    if (!isolating) return false;
    const ret = app.selection.head.isAtStartOfNode(isolating);
    return ret;
  }

  isAtEnd(e) {
    const { app } = e;
    const isolating = this.headIsolate(e);
    if (!isolating) return false;
    const ret = app.selection.head.isAtEndOfNode(isolating);
    return ret;
  }

  headIsolate(e) {
    const { app } = e;
    const { selection } = app;
    const { head } = selection;
    return head.node.closest((n) => n.isIsolate);
  }

  tailIsolate(e) {
    const { app } = e;
    const { selection } = app;
    const { tail } = selection;
    return tail.node.closest((n) => n.isIsolate);
  }
}
