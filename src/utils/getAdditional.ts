import { ESTIMATED_ROW_HEIGHT } from '../constants.ts';

export const getAdditional = (length: number, lastSet: number) => {
	let offset = lastSet;
	return new Array(length).fill(0).map(() => {
		offset = offset + ESTIMATED_ROW_HEIGHT;
		return { offset, measured: false };
	});
};
