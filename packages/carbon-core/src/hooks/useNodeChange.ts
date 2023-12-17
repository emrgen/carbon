import { useEffect, useMemo, useRef, useState } from "react";
import { useCarbonChange } from "./useCarbonChange";
import { NodeChangeType } from "../core/ChangeManager";
import { Node } from '../core/Node';
import { NodeAttrs } from "../core/NodeAttrs";
import { identity } from "lodash";
import { useNodeActivated, useNodeOpened, useNodeSelected } from "@emrgen/carbon-core";

interface UseTextChangeProps {
	node: Node,
	onChange(node: Node)
}

interface UseNodeChangeProps {
	node: Node,
	onChange?(node: Node)
}

// start watching for the node change
export const useNodeChange = (props: UseNodeChangeProps) => {
	const { node } = props;
	const {id: nodeId} = node;
	const change = useCarbonChange();
	const [watched, setWatched] = useState(node);
	// this will force the ui update
	// const [version, setVersion] = useState(node.version);

	useEffect(() => {
		const onChange = (value: Node) => {
			setWatched(value);
			// console.log(value.version, node.version, value.id.toString(), value.textContent);
			// console.log("node changed", value.name, watched.id.toString(),  watched === value, value.textContent, value.version, node.state.normalize());
		};
		change.subscribe(watched.id, NodeChangeType.update, onChange);
		return () => {
			change.unsubscribe(watched.id, NodeChangeType.update, onChange);
		}
	}, [change, watched]);

	useEffect(() => {
		change.mounted(watched, NodeChangeType.update)
	}, [change, watched]);

	return {
		node: watched,
		change,
	};
};


// const useNodeSelected = (props: UseNodeChangeProps) => {
