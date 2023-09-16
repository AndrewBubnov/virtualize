import { useMemo, useState, UIEvent, useRef, useCallback } from 'react';
import { AutoSizer } from 'components/AutoSizer/AutoSizer.tsx';
import { getInitCache } from 'utils/getInitCache.ts';
import { useScrollHeight } from 'hooks/useScrollHeight.ts';
import { useContainerHeight } from 'hooks/useContainerHeight.ts';
import { useAverageRowHeight } from 'hooks/useAverageRowHeight.ts';
import { CORRECTION, OVERSCAN } from 'constants.ts';
import { getOffset } from 'utils/getOffset.ts';
import { CacheItem, VirtualizedProps } from 'types.ts';
import styles from './Virtualized.module.css';

export const Virtualized = ({ items }: VirtualizedProps) => {
	const allRowsNumber = useMemo(() => items.length, [items.length]);
	const [scroll, setScroll] = useState<number>(0);
	const cache = useRef<CacheItem[]>(getInitCache(items.length));

	const [rowHeight, setRowHeight] = useAverageRowHeight();
	const [scrollHeight, setScrollHeight] = useScrollHeight(allRowsNumber);
	const { containerHeight, container } = useContainerHeight();

	const { virtualizedRows, startIndex, endIndex } = useMemo(() => {
		const startIndex = Math.max(Math.floor(scroll / rowHeight) - OVERSCAN, 0);
		const endIndex = Math.min(startIndex + Math.ceil(containerHeight / rowHeight) + 2 * OVERSCAN, allRowsNumber);

		const virtualizedRows = items.slice(startIndex, endIndex).map((item, index) => {
			const currentIndex = startIndex + index;
			return {
				text: item,
				index: currentIndex,
				transform: cache.current[currentIndex]?.offset || 0,
			};
		});
		return { virtualizedRows, startIndex, endIndex };
	}, [items, scroll, containerHeight, allRowsNumber, rowHeight]);

	const measureRowHeight = useCallback(
		(index: number) => {
			const offset = getOffset(cache.current[index - 1]);
			const rowRef = document.querySelector(`[data-index="${index}"]`);
			if (!rowRef) return;
			const height = rowRef.clientHeight;
			cache.current[index] = { offset, height };
			setScrollHeight({ index, offset });
		},
		[setScrollHeight]
	);

	const scrollHandler = useCallback(
		(evt: UIEvent<HTMLDivElement>) => {
			setScroll(evt.currentTarget.scrollTop);
			cache.current.slice(startIndex, endIndex + 1).forEach((element, index) => {
				if (!element.height) requestAnimationFrame(() => measureRowHeight(index));
			});
		},
		[startIndex, endIndex, measureRowHeight]
	);

	const sizeHandler = (index: number) => (height: number) => {
		const element = cache.current[index];
		const offset = getOffset(cache.current[index - 1]);

		if (element?.offset === offset && element?.height === height) return;

		cache.current[index] = { offset, height };
		if (index) setRowHeight(offset / index);

		setScrollHeight({ index, offset });
		setScroll(prevScroll => prevScroll + CORRECTION);
	};

	return (
		<div onScroll={scrollHandler} className={styles.container} ref={container}>
			<div style={{ height: `${scrollHeight}px` }}>
				{virtualizedRows.map(el => (
					<AutoSizer
						key={el.index}
						offset={el.transform}
						onHeightSet={sizeHandler(el.index)}
						dataIndex={el.index}
					>
						{el.text}
					</AutoSizer>
				))}
			</div>
		</div>
	);
};
