import { ESTIMATED_ROW_HEIGHT } from 'constants.ts';
import { CacheItem } from 'types.ts';
export const getInitCache = (length: number): CacheItem[] => {
	let offset = 0;
	return new Array(length).fill(0).map(() => {
		const prevOffset = offset;
		offset = offset + ESTIMATED_ROW_HEIGHT;
		return { offset: prevOffset, height: ESTIMATED_ROW_HEIGHT };
	});
};
