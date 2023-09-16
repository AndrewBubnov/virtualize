export const getOffset = (prevElement?: { offset: number; height: number }) =>
	(prevElement?.offset || 0) + (prevElement?.height || 0);
