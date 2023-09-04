import styles from './Virtualized.module.css';
import { useMemo, useRef, useState, UIEvent } from 'react';
import { loremIpsum } from 'lorem-ipsum';
import { clsx } from 'clsx';

const CONTAINER_HEIGHT = 550;
const ESTIMATED_ROW_HEIGHT = 50;
const OVERSCAN = 2;

const items = Array.from(
	{ length: 1_000 },
	(_, i) =>
		`${i + 1}. ${loremIpsum({
			format: 'plain',
			paragraphLowerBound: 3,
			paragraphUpperBound: 7,
			sentenceLowerBound: 5,
			sentenceUpperBound: 35,
		})}`
);

export const Virtualized = () => {
	const [scroll, setScroll] = useState<number>(0);
	const cache = useRef<{ offset: number; measured: boolean }[]>([]);
	const offset = useRef<number>(0);

	const allRowsNumber = useMemo(() => items.length, []);

	const virtualizedRows = useMemo(() => {
		const lastSet = cache.current.at(-1)?.offset || 1;
		if (scroll > lastSet) {
			let sum = lastSet;
			const additional = Array.from({ length: items.length - cache.current.length }, () => 0).map((_, index) => {
				sum = index ? sum + ESTIMATED_ROW_HEIGHT : sum;
				return { offset: index ? sum + ESTIMATED_ROW_HEIGHT : sum, measured: false };
			});
			cache.current = cache.current.concat(additional);
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
		// const end = Math.min(
		// 	values.findIndex(value => cache.current[startIndex + OVERSCAN] + CONTAINER_HEIGHT <= value) + OVERSCAN,
		// 	allRowsNumber
		// );
		return items.slice(startIndex, endIndex + 1).map((item, index) => {
			const currentIndex = startIndex + index;
			return {
				text: item,
				index: currentIndex,
				transform: cache.current[currentIndex]?.offset || 0,
			};
		});
	}, [allRowsNumber, scroll]);

	const refHandler = (index: number) => (entry: HTMLDivElement | null) => {
		if (!entry || cache.current[index]?.measured) return;
		cache.current[index] = { offset: offset.current, measured: true };
		offset.current = offset.current + entry.clientHeight;
	};

	const scrollHandler = (evt: UIEvent<HTMLDivElement>) => setScroll(evt.currentTarget.scrollTop);

	return (
		<div onScroll={scrollHandler} className={styles.container} style={{ height: `${CONTAINER_HEIGHT}px` }}>
			<div style={{ height: `${allRowsNumber * ESTIMATED_ROW_HEIGHT}px` }}>
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
