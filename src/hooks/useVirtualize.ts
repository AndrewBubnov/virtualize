import { ReactNode, UIEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAverageRowHeight } from 'hooks/useAverageRowHeight';
import { useScrollHeight } from 'hooks/useScrollHeight';
import { useContainerHeight } from 'hooks/useContainerHeight';
import { CacheItem, findOffset, getInitCache } from '../utils.ts';

const FORCE_UPDATE_VALUE = 0.001;

export const useVirtualize = (items: ReactNode[], overScan: number) => {
	const totalRowsNumber = useMemo(() => items.length, [items.length]);

	const [scroll, setScroll] = useState<number>(0);
	const cache = useRef<CacheItem[]>(getInitCache(items.length));

	const { rowHeight, setRowHeight } = useAverageRowHeight();
	const [scrollHeight, setScrollHeight] = useScrollHeight(totalRowsNumber);
	const { containerHeight, containerRef } = useContainerHeight();

	const { rows, startIndex } = useMemo(() => {
		const scrolledRows = Math.max(findOffset(cache.current, scroll), 0);

		const startIndex = Math.max(scrolledRows - overScan, 0);

		const endIndex = Math.min(Math.ceil(scrolledRows + overScan + containerHeight / rowHeight), totalRowsNumber);

		const rows = items.slice(startIndex, endIndex + 1).map((item, index) => {
			const currentIndex = startIndex + index;
			return {
				content: item,
				index: currentIndex,
				transform: cache.current[currentIndex]?.offset || 0,
			};
		});
		return { rows, startIndex };
	}, [totalRowsNumber, containerHeight, items, rowHeight, scroll, overScan]);

	const forceUpdate = useCallback(() => setScroll(prevScroll => prevScroll + FORCE_UPDATE_VALUE), []);

	useEffect(forceUpdate, [startIndex, forceUpdate]);

	const scrollHandler = useCallback((evt: UIEvent<HTMLDivElement>) => setScroll(evt.currentTarget.scrollTop), []);

	const mountHandler = (index: number) => (height: number) => {
		const { current } = cache;
		const element = current[index];
		const prevElement = current[index - 1];
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

	return { rows, mountHandler, scrollHeight, containerRef, scrollHandler, resizeHandler };
};
