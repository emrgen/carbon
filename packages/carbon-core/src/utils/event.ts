export const stop = e => e.stopPropagation()
export const prevent = e => e.preventDefault()
export const preventAndStop = e => {
	stop(e)
	prevent(e)
}
