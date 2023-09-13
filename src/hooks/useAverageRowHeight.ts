import { useRef } from 'react';
import { ESTIMATED_ROW_HEIGHT } from '../constants.ts';

export const useAverageRowHeight = (): [number, (arg: number) => void] => {
	const rowHeight = useRef<number>(ESTIMATED_ROW_HEIGHT);

	const setRowHeight = (height: number) => {
		rowHeight.current = height;
	};
	return [rowHeight.current, setRowHeight];
};
