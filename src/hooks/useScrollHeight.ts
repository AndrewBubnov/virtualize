import { useCallback, useRef, useState } from 'react';
import { ESTIMATED_ROW_HEIGHT } from 'constants.ts';
import { SetHeightArgs } from 'types.ts';

export const useScrollHeight = (totalRowsNumber: number): [number, ({ index, offset }: SetHeightArgs) => void] => {
	const [containerHeight, setContainerHeight] = useState<number>(0);
	const containerHeightRef = useRef<number>(totalRowsNumber * ESTIMATED_ROW_HEIGHT);

	const setHeight = useCallback(
		({ index, offset }: SetHeightArgs) => {
			containerHeightRef.current = (offset * totalRowsNumber) / (index || 1);
			if (index === totalRowsNumber - 1) setContainerHeight(containerHeightRef.current);
		},
		[totalRowsNumber]
	);

	const height = containerHeight || containerHeightRef.current;

	return [height, setHeight];
};
