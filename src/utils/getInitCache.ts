import { ESTIMATED_ROW_HEIGHT } from '../constants.ts';
export const getInitCache = (length: number) => {
	let offset = 0;
	return new Array(length).fill(0).map(() => {
		const prevOffset = offset;
		offset = offset + ESTIMATED_ROW_HEIGHT;
		return { offset: prevOffset, height: ESTIMATED_ROW_HEIGHT };
	});
};
