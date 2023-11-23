import { useEffect } from 'react';
import { useDndContext } from './useDndContext';
import { DndEvent } from '../types';
import { Node } from "@emrgen/carbon-core";

interface FastDndMonitor {
	onDragStart?(e: DndEvent);
	onDragMove?(e: DndEvent);
	onDragEnd?(e: DndEvent);
	onMouseDown?(node: Node, e: MouseEvent);
	onMouseUp?(node: Node, e: DndEvent, isDragging: boolean);
}

// register drag event listeners
export const useDndMonitor = (props: FastDndMonitor) => {
	const dnd = useDndContext()
	const {onDragStart, onDragMove, onDragEnd, onMouseDown, onMouseUp} = props;

	useEffect(() => {
		const handleDragStart = e => {
			onDragStart?.(e)
		}
		const handleDragMove = e => {
			onDragMove?.(e)
		}
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
