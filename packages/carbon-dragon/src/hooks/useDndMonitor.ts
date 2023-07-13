import { useEffect } from 'react';
import { useDndContext } from './useDndContext';
import { DndEvent } from '../types';

interface FastDndMonitor {
	onDragStart?(e: DndEvent);
	onDragMove?(e: DndEvent);
	onDragEnd?(e: DndEvent);
}

// register drag event listeners
export const useDndMonitor = (props: FastDndMonitor) => {
	const dnd = useDndContext()
	const {onDragStart, onDragMove, onDragEnd} = props;

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

		dnd.on('drag:start', handleDragStart)
		dnd.on('drag:move', handleDragMove)
		dnd.on('drag:end', handleDragEnd)

		return () => {
			dnd.off('drag:start', handleDragStart)
			dnd.off('drag:move', handleDragMove)
			dnd.off('drag:end', handleDragEnd)
		}
	}, [dnd, onDragStart, onDragMove, onDragEnd])
}
