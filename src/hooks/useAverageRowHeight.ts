import { useCallback, useRef } from 'react';
import { ESTIMATED_ROW_HEIGHT } from 'constants';

export const useAverageRowHeight = () => {
	const heightsRef = useRef<Map<number, number>>(new Map());
	const totalHeight = useRef<number>(0);
	const rowHeight = useRef<number>(ESTIMATED_ROW_HEIGHT);

	const count = useRef<number>(0);

	const setRowHeight = useCallback(({ height, index }: { height: number; index: number }) => {
		if (heightsRef.current.has(index)) return;
		heightsRef.current.set(index, height);
		totalHeight.current = totalHeight.current + height;
		count.current++;
		rowHeight.current = totalHeight.current / count.current;
	}, []);

	return { rowHeight: rowHeight.current, setRowHeight };
};
