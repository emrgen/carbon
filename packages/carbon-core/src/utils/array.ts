// take nodes including the one that matches the predicate
import { Predicate } from "@emrgen/types";

export const takeUpto = <T>(arr: T[], fn: Predicate<T>): T[] => {
	const ret: T[] = []
	arr.some(a => {
		ret.push(a)
		return fn(a);
	})

	return ret
}

// take nodes excluding the one that matches the predicate
export const takeUntil = <T>(arr: T[], fn: Predicate<T>): T[] => {
	return takeUpto(arr, fn).slice(0, -1);
}

// take nodes excluding the one that matches the predicate
export const takeBefore = <T>(arr: T[], fn:Predicate<T>): T[] => {
	return takeUntil(arr, fn);
}

// take nodes excluding the one that matches the predicate
export const takeAfter = <T>(arr: T[], fn: Predicate<T>): T[] => {
	const index = arr.findIndex(fn);
	if (index === -1) {
		return [];
	}

	return arr.slice(index + 1);
}
