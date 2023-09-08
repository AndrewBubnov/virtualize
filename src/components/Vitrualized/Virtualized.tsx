import { useMemo, useState, UIEvent, useRef } from 'react';
import { AutoSizer } from '../AutoSizer/AutoSizer.tsx';
import { getInitCache } from '../../utils/getInitCache.ts';
import { CONTAINER_HEIGHT, CORRECTION, ESTIMATED_ROW_HEIGHT, OVERSCAN } from 'constants.ts';
import styles from './Virtualized.module.css';

interface VirtualizedProps {
	items: string[];
}
type Cache = { offset: number; height: number }[];

export const Virtualized = ({ items }: VirtualizedProps) => {
	const allRowsNumber = useMemo(() => items.length, [items.length]);
	const [scroll, setScroll] = useState<number>(0);
	const cache = useRef<Cache>(getInitCache(items.length));
	const containerHeight = useRef<number>(allRowsNumber * ESTIMATED_ROW_HEIGHT);

	const virtualizedRows = useMemo(() => {
		const scrolledRows = Math.max(
			cache.current.findIndex(value => scroll < value.offset),
			0
		);

		const startIndex = Math.max(scrolledRows - OVERSCAN, 0);

		const endIndex = Math.min(
			Math.ceil(scrolledRows + OVERSCAN + CONTAINER_HEIGHT / ESTIMATED_ROW_HEIGHT),
			allRowsNumber
		);

		return items.slice(startIndex, endIndex + 1).map((item, index) => {
			const currentIndex = startIndex + index;
			return {
				text: item,
				index: currentIndex,
				transform: cache.current[currentIndex]?.offset || 0,
			};
		});
	}, [allRowsNumber, items, scroll]);

	const containerHeightHandler = (height: number) => {
		containerHeight.current = containerHeight.current + height - ESTIMATED_ROW_HEIGHT;
	};

	const cacheHandler = (index: number) => (height: number) => {
		const prevOffset = cache.current[index - 1]?.offset || 0;
		const prevHeight = cache.current[index - 1]?.height || 0;
		const offset = prevOffset + prevHeight;

		if (cache.current[index]?.offset === offset && cache.current[index]?.height === height) return;

		cache.current[index] = { offset, height };
		setScroll(prevScroll => prevScroll + CORRECTION);
		containerHeightHandler(height);
	};

	const scrollHandler = (evt: UIEvent<HTMLDivElement>) => setScroll(evt.currentTarget.scrollTop);

	return (
		<div onScroll={scrollHandler} className={styles.container} style={{ height: `${CONTAINER_HEIGHT}px` }}>
			<div style={{ height: `${containerHeight.current}px` }}>
				{virtualizedRows.map(el => (
					<AutoSizer key={el.index} offset={el.transform} heightSetter={cacheHandler(el.index)}>
						{el.text}
					</AutoSizer>
				))}
			</div>
		</div>
	);
};
