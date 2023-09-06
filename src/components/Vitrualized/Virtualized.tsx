import { useMemo, useRef, useState, UIEvent } from 'react';
import { clsx } from 'clsx';
import { CONTAINER_HEIGHT, ESTIMATED_ROW_HEIGHT, OVERSCAN } from 'constants.ts';
import { getAdditional } from 'utils/getAdditional.ts';
import styles from './Virtualized.module.css';

interface VirtualizedProps {
	items: string[];
}

export const Virtualized = ({ items }: VirtualizedProps) => {
	const allRowsNumber = useMemo(() => items.length, [items.length]);

	const [scroll, setScroll] = useState<number>(0);

	const cache = useRef<{ offset: number; height: number; measured: boolean }[]>([]);
	const scrollHeight = useRef<number>(allRowsNumber * ESTIMATED_ROW_HEIGHT);

	const virtualizedRows = useMemo(() => {
		const lastSet = cache.current.at(-1)?.offset || 1;

		if (scroll > lastSet && cache.current.length < items.length) {
			cache.current = cache.current.concat(getAdditional(allRowsNumber - cache.current.length, lastSet));
		}

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

	const refHandler = (index: number) => (entry: HTMLDivElement | null) => {
		const { current } = cache;
		if (!entry || current[index]?.measured) return;
		const prevOffset = current[index - 1]?.offset || 0;
		const prevHeight = current[index - 1]?.height || 0;
		current[index] = { offset: prevOffset + prevHeight, height: entry.clientHeight, measured: true };
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
							className={clsx(styles.row, { [styles.absolute]: element.transform })}
							style={{
								transform: `translateY(${element.transform}px)`,
							}}
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
