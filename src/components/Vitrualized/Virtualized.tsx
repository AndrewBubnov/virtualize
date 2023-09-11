import { useMemo, useState, UIEvent, useRef } from 'react';
import { AutoSizer } from 'components/AutoSizer/AutoSizer.tsx';
import { getInitCache } from 'utils/getInitCache.ts';
import { useScrollHeight } from 'hooks/useScrollHeight.ts';
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

	const [scrollHeight, setScrollHeight] = useScrollHeight(allRowsNumber);

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

	const sizeHandler = (index: number) => (height: number) => {
		const prevOffset = cache.current[index - 1]?.offset || 0;
		const prevHeight = cache.current[index - 1]?.height || 0;
		const offset = prevOffset + prevHeight;

		if (cache.current[index]?.offset === offset && cache.current[index]?.height === height) return;

		cache.current[index] = { offset, height };
		setScrollHeight({ index, offset });
		setScroll(prevScroll => prevScroll + CORRECTION);
	};

	const scrollHandler = (evt: UIEvent<HTMLDivElement>) => setScroll(evt.currentTarget.scrollTop);

	return (
		<div onScroll={scrollHandler} className={styles.container} style={{ height: `${CONTAINER_HEIGHT}px` }}>
			<div style={{ height: `${scrollHeight}px` }}>
				{virtualizedRows.map(el => (
					<AutoSizer key={el.index} offset={el.transform} heightSetter={sizeHandler(el.index)}>
						{el.text}
					</AutoSizer>
				))}
			</div>
		</div>
	);
};
