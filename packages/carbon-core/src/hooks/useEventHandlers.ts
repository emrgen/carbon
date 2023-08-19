import { camelCase } from "lodash";
import { useEffect, useMemo } from "react";
import { useCarbon } from './useCarbon';
import { EventsIn } from '../core/Event';

// listen for dom event
const defaultEvents: EventsIn[] = [
	EventsIn.beforeinput,
	EventsIn.input,
	EventsIn.keyUp,
	EventsIn.keyDown,
	EventsIn.click,
	EventsIn.mouseDown,
	EventsIn.mouseOver,
	EventsIn.mouseOut,
	EventsIn.mouseUp,
	EventsIn.scroll,
	EventsIn.blur,
	EventsIn.focus,
	EventsIn.paste,
];


export const useEventListeners = (events: EventsIn[] = defaultEvents) => {
	const app = useCarbon();

	const handlers = useMemo(() => {
		return events.reduce(
			(o, eventType) => ({
				...o,
				[camelCase(`on-${eventType}`)]: (event: Event) => {
					// console.log('xxx', eventType, event);

					app.onEvent(eventType, event);
				},
			}),
			{}
		);
	}, [app, events]);

	useEffect(() => {
		const onWindowResize = () => {
			app.emit('document:resize');
			app.emit('app:resize');
		};

		window.addEventListener('resize', onWindowResize);
		return () => {
			window.removeEventListener('resize', onWindowResize);
		}
	},[app])

	return handlers;
}
