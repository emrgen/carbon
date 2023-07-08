import { EventContext } from '../core';

export const stop = e => e.stopPropagation()
export const prevent = e => e.preventDefault()
export const preventAndStop = e => {
	stop(e)
	prevent(e)
}


export const preventAndStopCtx = (ctx: EventContext<any>) => {
	stop(ctx.event)
	prevent(ctx.event)
	ctx.stopPropagation()
}
