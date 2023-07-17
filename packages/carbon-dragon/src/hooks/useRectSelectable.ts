import { MutableRefObject, useEffect } from "react";
import { useRectSelector } from "./useRectSelector";
import { Node, useNodeChange } from "@emrgen/carbon-core";

interface UseFastSelectableProps {
	node: Node;
	ref: MutableRefObject<any>
}

// registers rect-selectable
export const useRectSelectable = (props: UseFastSelectableProps) => {
	const {node, ref} = props;
	const rectSelector = useRectSelector();
	const { version } = useNodeChange(props);

	useEffect(() => {
		if (ref.current && node.type.spec.rectSelectable) {
			rectSelector.onMountRectSelectable(node, ref.current);
			return () => {
				rectSelector.onUnmountRectSelectable(node,);
			};
		}
	}, [node, rectSelector, ref, version]);
}
