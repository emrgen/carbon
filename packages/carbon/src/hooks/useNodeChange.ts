import { useEffect, useMemo, useRef, useState } from "react";
import { useCarbonChange } from "./useCarbonChange";
import { NodeChangeType } from "../core/ChangeManager";
import { Node } from 'core/Node';

interface UseNodeChangeProps {
	node: Node,
}

export const useNodeChange = (props: UseNodeChangeProps) => {
	const {node} = props;
	const change = useCarbonChange();
	const [watched, setWatched] = useState(node);
	const [version, setVersion] = useState(node.version);

	useEffect(() => {
		const onChange = (value: Node) => {
			setVersion(value.version);
			setWatched(value);
			// console.log("updated", node.id.toString(), node.version, watched === value);
		};
		change.subscribe(node.id, NodeChangeType.update, onChange);
		return () => {
			change.unsubscribe(node.id, NodeChangeType.update, onChange);
		}
	}, [change, node.id]);

	useEffect(() => {
		change.mounted(watched)
	}, [change, version, watched]);

	return {
		node: watched,
		version: version,
	};
};

// start watching for the node change
export const useNodeStateChange = (props: UseNodeChangeProps) => {
	const { node } = props;
	const change = useCarbonChange();
	const [isActive, setIsActive] = useState(!!node.isActive);
	const [isSelected, setIsSelected] = useState(!!node.isSelected);

	useEffect(() => {
		const onChange = (value: Node) => {
			setIsActive(!!value.isActive);
			setIsSelected(!!value.isSelected);
			// console.log('state changed', node.id.toString(), !!value.data._state?.active, !!value.data._state?.selected);
		};

		change.subscribe(node.id, NodeChangeType.state, onChange);
		return () => {
			change.unsubscribe(node.id, NodeChangeType.state, onChange);
		}
	}, [change, node]);

	useEffect(() => {
		change.mounted(node);
	}, [node, isActive, isSelected, change]);

	const attributes = useMemo(() => {
		const ret = {}
		if (isSelected) {
			ret["data-selected"] = true
		}
		if (isActive) {
			ret["data-active"] = true
		}
		return ret
	},[isActive, isSelected]);

	return {
		isActive,
		isSelected,
		isNormal: !isActive && !isSelected,
		attributes,
	};
};
