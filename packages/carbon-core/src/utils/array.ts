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

export const takeBefore = <T>(arr: T[], fn): T[] => {
	return takeUntil(arr, fn);
}

export const takeAfter = <T>(arr: T[], fn): T[] => {
	const index = arr.findIndex(fn);
	if (index === -1) {
		return [];
	}

	return arr.slice(index + 1);
}
