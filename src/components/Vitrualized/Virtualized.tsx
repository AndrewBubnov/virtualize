import styles from './Virtualized.module.css';
import { useMemo, useRef, useState, UIEvent } from 'react';
import { loremIpsum } from 'lorem-ipsum';
import { clsx } from 'clsx';

const CONTAINER_HEIGHT = 550;
const ROW_HEIGHT = 40;
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
	const cache = useRef<{ [key: number]: number }>({});
	const offset = useRef<number>(0);

	const allRowsNumber = useMemo(() => items.length, []);

	const virtualizedRows = useMemo(() => {
		const values = Object.values(cache.current) as Array<(typeof cache.current)[keyof typeof cache.current]>;
		const scrolledRows = Math.max(
			values.findIndex(value => scroll < value),
			0
		);
		const startIndex = Math.max(scrolledRows - OVERSCAN, 0);

		const endIndex = Math.min(Math.ceil(scrolledRows + OVERSCAN + CONTAINER_HEIGHT / ROW_HEIGHT), allRowsNumber);
		// const end = Math.min(
		// 	values.findIndex(value => cache.current[startIndex + OVERSCAN] + CONTAINER_HEIGHT <= value) + OVERSCAN,
		// 	allRowsNumber
		// );
		// console.log(end);
		return items.slice(startIndex, endIndex + 1).map((item, index) => {
			const currentIndex = startIndex + index;
			return {
				text: item,
				index: currentIndex,
				transform: cache.current[currentIndex] || 0,
			};
		});
	}, [allRowsNumber, scroll]);

	const refHandler = (index: number) => (entry: HTMLDivElement | null) => {
		if (!entry || index in cache.current) return;
		const height = entry?.clientHeight || 0;
		cache.current[index] = offset.current;
		offset.current = offset.current + height;
	};

	const scrollHandler = (evt: UIEvent<HTMLDivElement>) => setScroll(evt.currentTarget.scrollTop);

	return (
		<div onScroll={scrollHandler} className={styles.container} style={{ height: `${CONTAINER_HEIGHT}px` }}>
			<div style={{ height: `${allRowsNumber * ROW_HEIGHT}px` }}>
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
