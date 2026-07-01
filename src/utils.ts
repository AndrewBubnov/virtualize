import { ESTIMATED_ROW_HEIGHT } from 'constants';

export type CacheItem = { offset: number; height: number };

export const getInitCache = (length: number): CacheItem[] => {
	let offset = 0;
	return new Array(length).fill(0).map(() => {
		const prevOffset = offset;
		offset = offset + ESTIMATED_ROW_HEIGHT;
		return { offset: prevOffset, height: ESTIMATED_ROW_HEIGHT };
	});
};

export const findOffset = (cache: CacheItem[], scroll: number) => {
	let left = 0;
	let right = cache.length - 1;

	while (left <= right) {
		const mid = left + Math.floor((right - left) / 2);

		if (cache[mid].offset <= scroll) {
			left = mid + 1;
		} else {
			right = mid - 1;
		}
	}

	return left;
};
