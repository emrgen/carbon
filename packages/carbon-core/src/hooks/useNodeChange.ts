import { useEffect, useMemo, useRef, useState } from "react";
import { useCarbonChange } from "./useCarbonChange";
import { NodeChangeType } from "../core/ChangeManager";
import { Node } from '../core/Node';
import { NodeAttrs } from "../core/NodeAttrs";
import { identity } from "lodash";
import { useNodeActivated, useNodeOpened, useNodeSelected } from "@emrgen/carbon-core";
import { Optional } from "@emrgen/types";

interface UseTextChangeProps {
	node: Node,
	onChange(node: Node)
}

interface UseNodeChangeProps {
	// parent: Optional<Node>;
	node: Node,
	onChange?(node: Node)
}

// start watching for the node change
export const useNodeChange = (props: UseNodeChangeProps) => {
	const change = useCarbonChange();
	const [node, setNode] = useState(props.node);
	// const [parent, setParent] = useState<Optional<Node>>(props.parent);
	// this will force the ui update
	// const [version, setVersion] = useState(node.version);

	useEffect(() => {
		const onChange = (value: Node, parent: Optional<Node>) => {
			setNode(value);
			// setParent(parent);
			// console.log(value.version, node.version, value.id.toString(), value.textContent);
			// console.log("node changed", value.name, watched.id.toString(),  watched === value, value.textContent, value.version, node.state.normalize());
		};
		change.subscribe(node.id, NodeChangeType.update, onChange);
		return () => {
			change.unsubscribe(node.id, NodeChangeType.update, onChange);
		}
	}, [change, node]);

	useEffect(() => {
		change.mounted(node, NodeChangeType.update)
	}, [change, node]);

	return {
		node,
		parent: null,
		change,
	};
};


// const useNodeSelected = (props: UseNodeChangeProps) => {
