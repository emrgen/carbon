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

// start watching for the node state change
export const useNodeStateChange = (props: UseNodeChangeProps) => {
	const { node } = props;

	const state = useMemo(() => {
		return node.state.normalize();
	}, [node.state]);

	const stateAttrs = useMemo(() => {
		const attrs = {};
		const state = node.state;
		if (state.activated) {
			attrs['data-activated'] = true;
		}
		if (state.selected) {
			attrs['data-selected'] = true;
		}
		if (state.opened) {
			attrs['data-opened'] = true;
		}

		return attrs;
	},[node.state]);

	return {
		isActive: state.activated,
		isSelected: state.selected,
		isOpened: state.opened,
		state,
		stateAttrs,
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
		// change.mounted(node, NodeChangeType.update);
	}, [node, change]);

	return attrs;
};
