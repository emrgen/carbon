import { useEffect } from 'react';
import { useDndContext } from './useDndContext';
import { Node } from "@emrgen/carbon-core";
import { throttle } from 'lodash';
import {DndEvent} from "@emrgen/carbon-dragon";

interface FastDndMonitor {
	onDragStart?(e: DndEvent): void;
	onDragMove?(e: DndEvent): void;
	onDragEnd?(e: DndEvent): void;
	onMouseDown?(node: Node, e: MouseEvent): void;
	onMouseUp?(node: Node, e: DndEvent, isDragging: boolean): void;
	options?: {
		throttle: number
	}
}

// register drag event listeners
export const useDndMonitor = (props: FastDndMonitor) => {
	const dnd = useDndContext()
	const { onDragStart, onDragMove, onDragEnd, onMouseDown, onMouseUp, options} = props;

	useEffect(() => {
		const handleDragStart = e => {
			onDragStart?.(e)
		}
		const handleDragMove = throttle(e => {
			onDragMove?.(e)
		}, options?.throttle ?? 0)
		const handleDragEnd = e => {
			onDragEnd?.(e)
		}

		const handleMouseDown = (node, e) => {
			onMouseDown?.(node, e)
		}

		const handleMouseUp = (node, e, isDragging) => {
			onMouseUp?.(node, e, isDragging)
		}

		dnd.on('drag:start', handleDragStart)
		dnd.on('drag:move', handleDragMove)
		dnd.on('drag:end', handleDragEnd)
		dnd.on('mouse:down', handleMouseDown)
		dnd.on('mouse:up', handleMouseUp)

		return () => {
			dnd.off('drag:start', handleDragStart)
			dnd.off('drag:move', handleDragMove)
			dnd.off('drag:end', handleDragEnd)
			dnd.off('mouse:down', handleMouseDown)
			dnd.off('mouse:up', handleMouseUp)
		}
	}, [dnd, onDragStart, onDragMove, onDragEnd, onMouseDown, onMouseUp])
}
