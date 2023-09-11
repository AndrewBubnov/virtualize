import { useRef, useState } from 'react';
import { ESTIMATED_ROW_HEIGHT } from '../constants.ts';

interface SetHeightArgs {
	index: number;
	offset: number;
}

export const useContainerHeight = (allRowsNumber: number): [number, ({ index, offset }: SetHeightArgs) => void] => {
	const [containerHeight, setContainerHeight] = useState<number>(0);
	const containerHeightRef = useRef<number>(allRowsNumber * ESTIMATED_ROW_HEIGHT);
	const setHeight = ({ index, offset }: SetHeightArgs) => {
		containerHeightRef.current = (offset * allRowsNumber) / (index || 1);
		if (index === allRowsNumber - 1) setContainerHeight(containerHeightRef.current);
	};
	const height = containerHeight || containerHeightRef.current;

	return [height, setHeight];
};
