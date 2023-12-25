import { useCallback, useState } from "react";
import {elementBound, NodeR3Tree} from "@emrgen/carbon-dragon";


const useBoundTree = () => {
	const [boundTree] = useState(() => new NodeR3Tree());
	const onMount = useCallback(
		(node, el) => {
			const bound = elementBound(el);
			console.log('add node', node.id.toString(), el)
			boundTree.add(node, bound);
			console.log(boundTree.all())
		},
		[boundTree]
	);

	const onUnmount = useCallback(
		(node, el) => {
			console.log('remove node', node.id.toString(), el)
			boundTree.remove(node);
			console.log(boundTree.all())
		},
		[boundTree]
	);

	return {
		onMount,
		onUnmount,
		boundTree,
	}
}
