import { useMemo, useRef, useState, UIEvent } from 'react';
import { clsx } from 'clsx';
import { CONTAINER_HEIGHT, ESTIMATED_ROW_HEIGHT, OVERSCAN } from 'constants.ts';
import { getAdditional } from 'utils/getAdditional.ts';
import styles from './Virtualized.module.css';

interface VirtualizedProps {
	items: string[];
}

export const Virtualized = ({ items }: VirtualizedProps) => {
	const [scroll, setScroll] = useState<number>(0);
	const cache = useRef<{ offset: number; measured: boolean }[]>([]);
	const offset = useRef<number>(0);
	const scrollHeight = useRef<number>(items.length * ESTIMATED_ROW_HEIGHT);

	const allRowsNumber = useMemo(() => items.length, [items.length]);

	const virtualizedRows = useMemo(() => {
		const lastSet = cache.current.at(-1)?.offset || 1;

		if (scroll > lastSet && cache.current.length < items.length) {
			cache.current = cache.current.concat(getAdditional(items.length - cache.current.length, lastSet));
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
		if (!entry || cache.current[index]?.measured) return;
		cache.current[index] = { offset: offset.current, measured: true };
		scrollHeight.current = scrollHeight.current + entry.clientHeight - ESTIMATED_ROW_HEIGHT;
		offset.current = offset.current + entry.clientHeight;
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
