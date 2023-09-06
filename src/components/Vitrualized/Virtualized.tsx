import { useMemo, useRef, useState, UIEvent } from 'react';
import { CONTAINER_HEIGHT, ESTIMATED_ROW_HEIGHT, OVERSCAN } from 'constants.ts';
import { getInitCache } from '../../utils/getInitCache.ts';
import styles from './Virtualized.module.css';

interface VirtualizedProps {
	items: string[];
}
type Cache = { offset: number; height: number; measured: boolean }[];

export const Virtualized = ({ items }: VirtualizedProps) => {
	const allRowsNumber = useMemo(() => items.length, [items.length]);

	const [scroll, setScroll] = useState<number>(0);
	const [cache, setCache] = useState<Cache>(getInitCache(items.length));

	const scrollHeight = useRef<number>(allRowsNumber * ESTIMATED_ROW_HEIGHT);

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

	const refHandler = (index: number) => (entry: HTMLDivElement | null) => {
		if (!entry || cache[index]?.measured) return;

		setCache(state => {
			const prevOffset = state[index - 1]?.offset || 0;
			const prevHeight = state[index - 1]?.height || 0;
			state[index] = { offset: prevOffset + prevHeight, height: entry.clientHeight, measured: true };
			return [...state];
		});
		scrollHeight.current = scrollHeight.current + entry.clientHeight - ESTIMATED_ROW_HEIGHT;
	};

	const scrollHandler = (evt: UIEvent<HTMLDivElement>) => setScroll(evt.currentTarget.scrollTop);

	return (
		<div onScroll={scrollHandler} className={styles.container} style={{ height: `${CONTAINER_HEIGHT}px` }}>
			<div style={{ height: `${scrollHeight.current}px` }}>
				{virtualizedRows.map(element => {
					return (
						<div
							key={element.index}
							className={styles.row}
							style={{ transform: `translateY(${element.transform}px)` }}
							ref={refHandler(element.index)}
						>
							{element.text}
						</div>
					);
				})}
			</div>
		</div>
	);
};
