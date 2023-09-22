import { ReactElement, UIEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAverageRowHeight } from 'hooks/useAverageRowHeight.ts';
import { useScrollHeight } from 'hooks/useScrollHeight.ts';
import { useContainerHeight } from 'hooks/useContainerHeight.ts';
import { getInitCache } from 'utils/getInitCache.ts';
import { CORRECTION, OVERSCAN } from 'constants.ts';
import { CacheItem } from 'types.ts';

export const useVirtualize = (items: ReactElement[]) => {
	const totalRowsNumber = useMemo(() => items.length, [items.length]);

	const [scroll, setScroll] = useState<number>(0);
	const cache = useRef<CacheItem[]>(getInitCache(items.length));

	const { rowHeight, setRowHeight } = useAverageRowHeight();
	const [scrollHeight, setScrollHeight] = useScrollHeight(totalRowsNumber);
	const { containerHeight, containerRef } = useContainerHeight();

	const { rows, startIndex } = useMemo(() => {
		const scrolledRows = Math.max(
			cache.current.findIndex(value => scroll < value.offset),
			0
		);

		const startIndex = Math.max(scrolledRows - OVERSCAN, 0);

		const endIndex = Math.min(Math.ceil(scrolledRows + OVERSCAN + containerHeight / rowHeight), totalRowsNumber);

		const rows = items.slice(startIndex, endIndex + 1).map((item, index) => {
			const currentIndex = startIndex + index;
			return {
				content: item,
				index: currentIndex,
				transform: cache.current[currentIndex]?.offset || 0,
			};
		});
		return { rows, startIndex };
	}, [totalRowsNumber, containerHeight, items, rowHeight, scroll]);

	const forceUpdate = useCallback(() => setScroll(prevScroll => prevScroll + CORRECTION), []);

	useEffect(forceUpdate, [startIndex, forceUpdate]);

	const scrollHandler = useCallback((evt: UIEvent<HTMLDivElement>) => setScroll(evt.currentTarget.scrollTop), []);

	const initSizeHandler = (index: number) => (height: number) => {
		const element = cache.current[index];
		const prevElement = cache.current[index - 1];
		const offset = (prevElement?.offset || 0) + (prevElement?.height || 0);

		if (element?.offset === offset && element?.height === height) return;
		cache.current[index] = { offset, height };
		setScrollHeight({ offset, index });
		setRowHeight({ height, index });
	};

	const resizeHandler = (index: number) => (height: number) => {
		cache.current = cache.current.map((el, cacheIndex) => {
			if (cacheIndex < index) return el;
			if (cacheIndex === index) {
				return { ...el, height };
			}
			const diff = height - cache.current[index].height;
			return { ...el, offset: el.offset + diff };
		});
		forceUpdate();
	};

	return { rows, initSizeHandler, scrollHeight, containerRef, scrollHandler, resizeHandler };
};
