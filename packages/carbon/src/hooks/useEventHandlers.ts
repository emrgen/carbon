import { camelCase } from "lodash";
import { useMemo } from "react";
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
	EventsIn.mouseDown,
	EventsIn.mouseOver,
	EventsIn.mouseOut,
	EventsIn.mouseUp,
	EventsIn.scroll,
	EventsIn.blur,
	EventsIn.focus,
];


export const useEventListeners = (events: EventsIn[] = defaultEvents) => {
	const app = useCarbon();

	const handlers = useMemo(() => {
		return events.reduce(
			(o, eventType) => ({
				...o,
				[camelCase(`on-${eventType}`)]: (event: Event) => {
					app.onEvent(eventType, event);
				},
			}),
			{}
		);
	}, [app, events]);

	return handlers;
}
