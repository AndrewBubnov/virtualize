import { useMemo, useState, UIEvent, useRef } from 'react';
import { AutoSizer } from 'components/AutoSizer/AutoSizer.tsx';
import { getInitCache } from 'utils/getInitCache.ts';
import { useScrollHeight } from 'hooks/useScrollHeight.ts';
import { useContainerHeight } from 'hooks/useContainerHeight.ts';
import { useAverageRowHeight } from 'hooks/useAverageRowHeight.ts';
import { CORRECTION, OVERSCAN } from 'constants.ts';
import styles from './Virtualized.module.css';

interface VirtualizedProps {
	items: string[];
}
type Cache = { offset: number; height: number }[];

export const Virtualized = ({ items }: VirtualizedProps) => {
	const allRowsNumber = useMemo(() => items.length, [items.length]);
	const [scroll, setScroll] = useState<number>(0);
	const cache = useRef<Cache>(getInitCache(items.length));

	const [rowHeight, setRowHeight] = useAverageRowHeight();
	const [scrollHeight, setScrollHeight] = useScrollHeight(allRowsNumber);
	const { containerHeight, container } = useContainerHeight();

	const virtualizedRows = useMemo(() => {
		const scrolledRows = Math.max(
			cache.current.findIndex(value => scroll < value.offset),
			0
		);

		const startIndex = Math.max(scrolledRows - OVERSCAN, 0);

		const endIndex = Math.min(Math.ceil(scrolledRows + OVERSCAN + containerHeight / rowHeight), allRowsNumber);

		return items.slice(startIndex, endIndex + 1).map((item, index) => {
			const currentIndex = startIndex + index;
			return {
				text: item,
				index: currentIndex,
				transform: cache.current[currentIndex]?.offset || 0,
			};
		});
	}, [allRowsNumber, containerHeight, items, rowHeight, scroll]);

	const forceUpdate = () => setScroll(prevScroll => prevScroll + CORRECTION);

	const sizeHandler = (index: number) => (height: number) => {
		const element = cache.current[index];
		const prevElement = cache.current[index - 1];
		const prevOffset = prevElement?.offset || 0;
		const prevHeight = prevElement?.height || 0;
		const offset = prevOffset + prevHeight;

		if (element?.offset === offset && element?.height === height) return;

		cache.current[index] = { offset, height };
		if (index) setRowHeight(offset / index);

		setScrollHeight({ index, offset });
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
