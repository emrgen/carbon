import { MutableRefObject, useEffect } from "react";
import { useRectSelector } from "./useRectSelector";
import { Node, } from "@emrgen/carbon-core";
import {useCarbon} from "@emrgen/carbon-react";

interface UseFastSelectableProps {
	node: Node;
	ref: MutableRefObject<any>
}

// registers rect-selectable
export const useRectSelectable = (props: UseFastSelectableProps) => {
	const {node, ref} = props;
	const rectSelector = useRectSelector();
	const app = useCarbon();
	useEffect(() => {
	  rectSelector.onMountRectSelectable(node, ref.current);
		return () => {
			rectSelector.onUnmountRectSelectable(node,);
		}
	}, [app.state, node, rectSelector, ref]);
}
