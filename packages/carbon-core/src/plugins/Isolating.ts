import {
  ActionOrigin,
  AfterPlugin, ContenteditablePath,
  EventContext,
  EventHandlerMap, LocalContenteditablePath,
  Pin,
  PinnedSelection, SuppressContenteditableWarningPath,
  UserSelectPath
} from "../core";
import {preventAndStopCtx} from "@emrgen/carbon-core";
import {Optional} from "@emrgen/types";

export const createIsolatingPlugin = () => {
  new IsolatingPlugin();
};

// handle caret movement around isolating nodes
export class IsolatingPlugin extends AfterPlugin {
  name = "isolating";

  // needs to be more than KeyboardPrevent.priority
  priority = 10 ** 4 + 600;

  handlers(): EventHandlerMap {
    return {}
    return {
      mouseDown: (ctx: EventContext<Event>) => {
        const {cmd, app, event} = ctx;
        if (!app.selection.isCollapsed) return
        const store = app.store;
        let el = event.target as Optional<HTMLElement>;
        let node = store.get(el!);

        while (el && !node && el != app.contentElement) {
          node = store.get(el);
          el = el.parentElement;
        }

        if (!node) return;

        console.log('selectstart', ctx.type, ctx);
        const isolating = node.closest((n) => n.isIsolating);
        if (!isolating) return;

        // make the isolating node selectable for the duration of the mouse down

        // isolating node should become selectable
        // all other isolating nodes should become non-selectable
        // these include all child isolating nodes and all parent isolating nodes
        // this is needed to prevent selection of nodes inside other isolating nodes

        // make all ge level isolating nodes non selectable
        app.content.preorder(n => {
          if (n.isIsolating) {
            cmd.Update(n, {
              // [UserSelectPath]: 'none', // making parent user-select=none will make the target node non selectable
              [ContenteditablePath]: 'false',
              [SuppressContenteditableWarningPath]: 'true',
            })
          }

          return false
        }, {
          skip: n => n.eq(isolating)
        })

        // make all child isolating nodes non selectable
        isolating.descendants(n => n.isIsolating).forEach((n) => {
          cmd.Update(n, {
            [UserSelectPath]: 'none',
            [ContenteditablePath]: 'false',
            [SuppressContenteditableWarningPath]: 'true',
          })
        })

        cmd.Dispatch();

        const onMouseUp = (e) => {
          e.preventDefault();
          const {cmd} = app;
            // make all ge level isolating nodes non selectable
            app.content.preorder(n => {
              if (n.isIsolating) {
                cmd.Update(n, {
                  [ContenteditablePath]: 'true',
                })
              }

              return false
            }, {
              skip: n => n.eq(isolating)
            })

            // make all child isolating nodes non selectable
            isolating.descendants(n => n.isIsolating).forEach((n) => {
              cmd.Update(n, {
                [UserSelectPath]: '',
                [ContenteditablePath]: 'true',
              })
            })

          cmd.Dispatch();
          window.removeEventListener('mouseup', onMouseUp);
        }
        window.addEventListener('mouseup', onMouseUp);
      },

      // TODO: may be mark all the isolating nodes as non-focusable
      // selecting within a isolating node
      _selectionchange: (ctx: EventContext<Event>) => {
        const {selection, cmd} = ctx;
        const {start, end, head, tail} = selection;
        if (selection.isCollapsed) return;

        const headIsolating = head.node.closest((n) => n.isIsolating);
        const tailIsolating = tail.node.closest((n) => n.isIsolating);
        console.log(tailIsolating, headIsolating)
        if (!headIsolating && !tailIsolating) return;

        if (headIsolating && tailIsolating && !headIsolating.eq(tailIsolating)) {
          // keep the selection outside the child isolating node
          if (headIsolating.parents.some((n) => n.eq(tailIsolating))) {
            if (selection.isForward) {
              const prevFocusable = headIsolating.prev((n) => n.isFocusable, {
                skip: n => n.isIsolating
              });
              if (prevFocusable) {
                const headPin = Pin.toEndOf(prevFocusable)!;
                const newSelection = PinnedSelection.create(tail, headPin, ActionOrigin.UserInput);
                cmd.Select(newSelection, ActionOrigin.UserInput).Dispatch();
              }
            } else {
              const nextFocusable = headIsolating.next((n) => n.isFocusable, {
                skip: n => n.isIsolating
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
      }
    };
  }

  keydown(): EventHandlerMap {
    return {
      shiftUp: (e: EventContext<KeyboardEvent>) => {
        if (e.app.selection.isBlock) return;
        const { selection, node } = e;
        const { head } = selection;

        // cursor can move to the previous focusable node
        const prevFocusable = head.node.prev((n) => n.isFocusable);
        if (!prevFocusable) return;

        // but only if it's not inside same isolating node as the current one
        const isolating = head.node.closest((n) => n.isIsolating);
        if (isolating && !prevFocusable.parents.some((n) => n.eq(isolating))) {
          this.prevent(e);
          return;
        }

        // or only if the current node is inside the previous isolating node
        const prevIsolating = prevFocusable.closest((n) => n.isIsolating);
        if (prevIsolating && !node.parents.some((n) => n.eq(prevIsolating))) {
          this.prevent(e);
          return;
        }
      },
      shiftDown: (e: EventContext<KeyboardEvent>) => {
        if (e.app.selection.isBlock) return;
        const { selection } = e;
        const { head } = selection;

        // cursor can move to the next focusable node
        const nextFocusable = head.node.next((n) => n.isFocusable);
        if (!nextFocusable) return;

        // but only if it's not inside same isolating node as the current one
        const isolating = head.node.closest((n) => n.isIsolating);
        if (isolating && !nextFocusable.parents.some((n) => n.eq(isolating))) {
          this.prevent(e);
          return;
        }

        // or only if the current node is inside the next isolating node
        const nextIsolating = nextFocusable.closest((n) => n.isIsolating);
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
    return head.node.closest((n) => n.isIsolating);
  }
}
