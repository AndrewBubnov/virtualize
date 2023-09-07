import { useMemo, useState, UIEvent } from 'react';
import { CONTAINER_HEIGHT, ESTIMATED_ROW_HEIGHT, OVERSCAN } from 'constants.ts';
import { getInitCache } from '../../utils/getInitCache.ts';
import styles from './Virtualized.module.css';
import { AutoSizer } from '../AutoSizer/Autosizer.tsx';

interface VirtualizedProps {
	items: string[];
}
type Cache = { offset: number; height: number }[];

export const Virtualized = ({ items }: VirtualizedProps) => {
	const allRowsNumber = useMemo(() => items.length, [items.length]);

	const [scroll, setScroll] = useState<number>(0);
	const [cache, setCache] = useState<Cache>(getInitCache(items.length));

	const virtualizedRows = useMemo(() => {
		const scrolledRows = Math.max(
			cache.findIndex(value => scroll < value.offset),
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
				transform: cache[currentIndex]?.offset || 0,
			};
		});
	}, [allRowsNumber, cache, items, scroll]);

	const containerHeight = useMemo(() => Object.values(cache).reduce((acc, cur) => acc + cur.height, 0), [cache]);

	const refHandler = (index: number) => (height: number) => {
		const prevOffset = cache[index - 1]?.offset || 0;
		const prevHeight = cache[index - 1]?.height || 0;
		const offset = prevOffset + prevHeight;

		if (cache[index]?.offset === offset && cache[index]?.height === height) return;

		setCache(state => [...state.slice(0, index), { offset, height }, ...state.slice(index + 1)]);
	};

	const scrollHandler = (evt: UIEvent<HTMLDivElement>) => setScroll(evt.currentTarget.scrollTop);

	return (
		<div onScroll={scrollHandler} className={styles.container} style={{ height: `${CONTAINER_HEIGHT}px` }}>
			<div style={{ height: `${containerHeight}px` }}>
				{virtualizedRows.map(el => (
					<AutoSizer key={el.index} element={el} resizeHandler={refHandler(el.index)} />
				))}
			</div>
		</div>
	);
};
