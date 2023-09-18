import { useCallback, useRef } from 'react';
import { ESTIMATED_ROW_HEIGHT } from 'constants.ts';

export const useHeight = (totalRowsNumber: number) => {
	const heightsRef = useRef<Record<number, number>>({});
	const totalHeight = useRef<number>(0);
	const rowHeight = useRef<number>(ESTIMATED_ROW_HEIGHT);
	const scrollHeight = useRef<number>(totalRowsNumber * ESTIMATED_ROW_HEIGHT);

	const setRowHeight = useCallback(({ height, index }: { height: number; index: number }) => {
		if (!index || heightsRef.current[index]) return;
		heightsRef.current[index] = height;
		totalHeight.current = totalHeight.current + height;
		rowHeight.current = totalHeight.current / Object.keys(heightsRef.current).length;
		if (height !== ESTIMATED_ROW_HEIGHT) {
			scrollHeight.current = scrollHeight.current + height - ESTIMATED_ROW_HEIGHT;
		}
	}, []);

	return { rowHeight: rowHeight.current, scrollHeight: scrollHeight.current, setRowHeight };
};
