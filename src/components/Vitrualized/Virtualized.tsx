import { useMemo, useState, UIEvent, useRef } from 'react';
import { AutoSizer } from 'components/AutoSizer/AutoSizer.tsx';
import { getInitCache } from 'utils/getInitCache.ts';
import { useContainerHeight } from 'hooks/useContainerHeight.ts';
import { useHeight } from 'hooks/useHeight.ts';
import { CORRECTION, OVERSCAN } from 'constants.ts';
import { CacheItem, VirtualizedProps } from 'types.ts';
import styles from './Virtualized.module.css';

export const Virtualized = ({ items }: VirtualizedProps) => {
	const totalRowsNumber = useMemo(() => items.length, [items.length]);
	const [scroll, setScroll] = useState<number>(0);
	const cache = useRef<CacheItem[]>(getInitCache(items.length));

	const { rowHeight, scrollHeight, setRowHeight } = useHeight(totalRowsNumber);
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

	const sizeHandler = (index: number) => (height: number) => {
		const element = cache.current[index];
		const prevElement = cache.current[index - 1];
		const offset = (prevElement?.offset || 0) + (prevElement?.height || 0);

		if (element?.offset === offset && element?.height === height) return;
		cache.current[index] = { offset, height };

		setRowHeight({ height, index });
		forceUpdate();
	};

	const scrollHandler = (evt: UIEvent<HTMLDivElement>) => setScroll(evt.currentTarget.scrollTop);

	return (
		<div onScroll={scrollHandler} className={styles.container} ref={container}>
			<div style={{ height: `${scrollHeight}px` }}>
				{virtualizedRows.map(el => (
					<AutoSizer key={el.index} offset={el.transform} onHeightSet={sizeHandler(el.index)}>
						{el.text}
					</AutoSizer>
				))}
			</div>
		</div>
	);
};
