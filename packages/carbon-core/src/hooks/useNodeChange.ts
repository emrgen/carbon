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
	onChange?(node: Node)
}

// start watching for the node change
export const useNodeChange = (props: UseNodeChangeProps) => {
	const { node } = props;
	const change = useCarbonChange();
	const [watched, setWatched] = useState(node);
	// this will force the ui update
	const [version, setVersion] = useState(node.version);

	useEffect(() => {
		const onChange = (value: Node) => {
			props.onChange?.(value);
			setVersion(value.version);
			setWatched(value);
			// console.log("updated", node.id.toString(), node.version, watched === value);
		};
		change.subscribe(node.id, NodeChangeType.update, onChange);
		return () => {
			change.unsubscribe(node.id, NodeChangeType.update, onChange);
		}
	}, [change, node.id, node.version, props, watched]);

	useEffect(() => {
		change.mounted(watched, NodeChangeType.update)
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
	const [isOpen, setIsOpen] = useState(!!node.isOpen);
	const [isActive, setIsActive] = useState(!!node.isActive);
	const [isSelected, setIsSelected] = useState(!!node.isSelected);

	useEffect(() => {
		const onChange = (value: Node) => {
			setIsActive(!!value.isActive);
			setIsSelected(!!value.isSelected);
			setIsOpen(!!value.isOpen);
			// console.log('state changed', node.id.toString(), !!value.data.state?.active, !!value.data.state?.selected, !!value.data.state?.open);
		};

		change.subscribe(node.id, NodeChangeType.state, onChange);
		return () => {
			change.unsubscribe(node.id, NodeChangeType.state, onChange);
		}
	}, [change, node]);

	// inform the change manager that this node is mounted
	useEffect(() => {
		change.mounted(node, NodeChangeType.state);
	}, [node, isActive, isSelected, isOpen, change]);

	const attributes = useMemo(() => {
		const ret = {}
		if (isSelected) {
			ret["data-selected"] = true
		}
		if (isActive) {
			ret["data-active"] = true
		}
		if (isOpen) {
			ret["data-open"] = true
		}
		// console.log('attributes', ret);
		
		return ret
	}, [isActive, isSelected, isOpen]);

	return {
		isActive,
		isSelected,
		isOpen,
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
		change.mounted(node, NodeChangeType.update);
	}, [node, change]);

	return attrs;
};
