import { Carbon } from "./Carbon";
import { PinnedSelection } from "./PinnedSelection";

export class SelectionManager {
  focused = false;

  constructor(readonly app: Carbon) {}

  private get state() {
    return this.app.state;
  }

  get enabled() {
    return this.app.enabled;
  }

  focus() {
    this.app.element?.focus();
    this.focused = true;
  }

  blur() {
    console.log(this.app.element);
    this.app.element?.blur();
    this.focused = false;
  }

  // update placeholder visibility for the focus node
  private updateFocusPlaceholder(
    before?: PinnedSelection,
    after?: PinnedSelection,
  ) {
    // if (after?.isCollapsed || !after) {
    // 	const prevNode = before?.head.node.closest(n => n.isContainerBlock);
    // 	const currNode = after?.head.node.closest(n => n.isContainerBlock);
    // 	if (currNode && prevNode?.eq(currNode)) return
    // 	if (before?.isCollapsed && prevNode && prevNode?.firstChild?.isEmpty) {
    // 		prevNode.updateAttrs({
    // 			html: {
    // 				'data-focused': 'false',
    // 				placeholder: prevNode.attrs.node.emptyPlaceholder ?? ''
    // 			},
    // 		})
    // 		this.runtime.updatedNodeIds.add(prevNode.id)
    // 	}
    // 	if (!currNode?.firstChild?.isEmpty) {
    // 		return
    // 	}
    // 	currNode.updateAttrs({
    // 		html: {
    // 			'data-focused': 'true',
    // 			placeholder: currNode.attrs.node.focusPlaceholder || 'Type "/" for commands'
    // 		},
    // 	})
    // 	this.runtime.updatedNodeIds.add(currNode.id)
    // }
  }
}
