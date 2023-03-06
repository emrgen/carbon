export const takeUpto = <T>(arr: T[], fn): T[] => {
	const ret: T[] = []
	arr.some(a => {
		ret.push(a)
		return fn(a);
	})

	return ret
}

export const takeUntil = <T>(arr: T[], fn): T[] => {
	return takeUpto(arr, fn).slice(0, -1);
}
