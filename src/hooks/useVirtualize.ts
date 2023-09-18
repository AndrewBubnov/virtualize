import { UIEvent, useMemo, useRef, useState } from 'react';
import { useAverageRowHeight } from './useAverageRowHeight.ts';
import { useScrollHeight } from './useScrollHeight.ts';
import { useContainerHeight } from './useContainerHeight.ts';
import { CORRECTION, OVERSCAN } from 'constants.ts';
import { getInitCache } from 'utils/getInitCache.ts';
import { CacheItem } from 'types.ts';
export const useVirtualize = (items: string[]) => {
	const totalRowsNumber = useMemo(() => items.length, [items.length]);

	const [scroll, setScroll] = useState<number>(0);
	const cache = useRef<CacheItem[]>(getInitCache(items.length));

	const { rowHeight, setRowHeight } = useAverageRowHeight();
	const [scrollHeight, setScrollHeight] = useScrollHeight(totalRowsNumber);
	const { containerHeight, container } = useContainerHeight();

	const virtualizedRows = useMemo(() => {
		const scrolledRows = Math.max(
			cache.current.findIndex(value => scroll < value.offset),
			0
		);

		const startIndex = Math.max(scrolledRows - OVERSCAN, 0);

		const endIndex = Math.min(Math.ceil(scrolledRows + OVERSCAN + containerHeight / rowHeight), totalRowsNumber);

		return items.slice(startIndex, endIndex + 1).map((item, index) => {
			const currentIndex = startIndex + index;
			return {
				text: item,
				index: currentIndex,
				transform: cache.current[currentIndex]?.offset || 0,
			};
		});
	}, [totalRowsNumber, containerHeight, items, rowHeight, scroll]);

	const forceUpdate = () => setScroll(prevScroll => prevScroll + CORRECTION);

	const scrollHandler = (evt: UIEvent<HTMLDivElement>) => setScroll(evt.currentTarget.scrollTop);

	const sizeHandler = (index: number) => (height: number) => {
		const element = cache.current[index];
		const prevElement = cache.current[index - 1];
		const offset = (prevElement?.offset || 0) + (prevElement?.height || 0);

		if (element?.offset === offset && element?.height === height) return;
		cache.current[index] = { offset, height };
		setScrollHeight({ offset, index });
		setRowHeight({ height, index });
		forceUpdate();
	};

	return { virtualizedRows, sizeHandler, scrollHeight, container, scrollHandler };
};
