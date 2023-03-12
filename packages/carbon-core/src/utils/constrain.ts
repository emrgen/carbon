export const constrain = (index: number, min: number, max: number): number => {
	index = Math.min(max, index);
	index = Math.max(min, index);
	return index;
}
