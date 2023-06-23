import { useEffect, useMemo, useRef, useState } from "react";
import { useCarbonChange } from "./useCarbonChange";
import { NodeChangeType } from "../core/ChangeManager";
import { Node } from '../core/Node';
import { NodeAttrs } from "../core/NodeAttrs";

interface UseTextChangeProps {
	node: Node,
	onChange(node: Node)
}

export const useTextChange = (props: UseTextChangeProps) => {
	const { node } = props;
	const change = useCarbonChange();
	// const [watched, setWatched] = useState(node);

	useEffect(() => {
		const onChange = (value: Node) => {
			props.onChange(value);
			// change.mounted(value);
			// setWatched(value);
			// console.log("updated", node.id.toString(), node.version, watched === value);
		};

		change.subscribe(node.id, NodeChangeType.update, onChange);
		return () => {
			change.unsubscribe(node.id, NodeChangeType.update, onChange);
		}
	}, [change, node.id, node.version, props]);

	return {
		// node: watched,
		change,
	};
};

interface UseNodeChangeProps {
	node: Node,
	onChange?()
}

// start watching for the node change
export const useNodeChange = (props: UseNodeChangeProps) => {
	const {node} = props;
	const change = useCarbonChange();
	const [watched, setWatched] = useState(node);
	// this will force the ui update
	const [version, setVersion] = useState(node.version);

	useEffect(() => {
		const onChange = (value: Node) => {
			props.onChange?.()
			setVersion(value.version);
			setWatched(value);
			console.log("updated", node.id.toString(), node.version, watched === value);
		};
		change.subscribe(node.id, NodeChangeType.update, onChange);
		return () => {
			change.unsubscribe(node.id, NodeChangeType.update, onChange);
		}
	}, [change, node.id, node.version, props, watched]);

	useEffect(() => {
		change.mounted(watched)
	}, [change, version, watched]);

	return {
		node: watched,
		version: version,
	};
};

// start watching for the node state change
export const useNodeStateChange = (props: UseNodeChangeProps) => {
	const { node } = props;
	const change = useCarbonChange();
	const [isActive, setIsActive] = useState(!!node.isActive);
	const [isSelected, setIsSelected] = useState(!!node.isSelected);

	useEffect(() => {
		const onChange = (value: Node) => {
			setIsActive(!!value.isActive);
			setIsSelected(!!value.isSelected);
			console.log('state changed', node.id.toString(), !!value.data.state?.active, !!value.data.state?.selected);
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


// start watching for the node state change
export const useNodeAttrs = (props: UseNodeChangeProps) => {
	const { node } = props;
	const change = useCarbonChange();
	const [attrs, setAttrs] = useState<NodeAttrs>(new NodeAttrs(node.attrs));

	useEffect(() => {
		const onChange = (value: Node) => {
			setAttrs(value.attrs);
		};

		change.subscribe(node.id, NodeChangeType.update, onChange);
		return () => {
			change.unsubscribe(node.id, NodeChangeType.update, onChange);
		}
	}, [change, node]);

	useEffect(() => {
		change.mounted(node);
	}, [node, change]);

	return attrs;
};
