import { EventContext } from '../core';

// export const stop(fn: Function)

interface EventPreventable {
	preventDefault(): void
}

interface EventStoppable {
	stopPropagation(): void
}

export function stop<T extends EventStoppable>(event: T): void
export function stop<T extends EventStoppable>(fn: Function): (event: T) => void

export function stop<T extends EventStoppable>(eventOrFn: T | Function): ((event: T) => void) | void {
	if (typeof eventOrFn === "function") {
		return (e) => {
			e.stopPropagation()
			eventOrFn()
		}
	} else {
		eventOrFn.stopPropagation()
	}
}

export function prevent<T extends EventPreventable>(event: T): void
export function prevent<T extends EventPreventable>(fn: Function): (event: T) => void

export function prevent<T extends EventPreventable>(eventOrFn: T | Function): ((event: T) => void) | void {
	if (typeof eventOrFn === "function") {
		return (e) => {
			e.preventDefault()
			eventOrFn()
		}
	} else {
		eventOrFn.preventDefault()
	}
}

export function preventAndStop<T extends EventPreventable & EventStoppable>(event: T) {
	event.preventDefault()
	event.stopPropagation()
}

export const preventAndStopCtx = (ctx: EventContext<any>) => {
	stop(ctx.event)
	prevent(ctx.event)
	ctx.stopPropagation()
}



