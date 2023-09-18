import { useLayoutEffect, useRef } from 'react';
import { AutoSizerProps } from 'types.ts';
import { useLatest } from 'hooks/useLatest.ts';
import styles from './AutoSizer.module.css';

export const AutoSizer = ({ offset, onInitHeightSet, onResize, children }: AutoSizerProps) => {
	const ref = useRef<HTMLDivElement | null>(null);
	const resize = useLatest<(height: number) => void>(onResize);

	useLayoutEffect(() => {
		if (!ref.current) return;
		let currentHeight = 0;
		let isResized = false;
		const observer = new ResizeObserver(([entry]) => {
			const height = entry.borderBoxSize[0].blockSize;
			if (currentHeight) {
				resize(height);
				isResized = true;
				return;
			}
			onInitHeightSet(height);
			currentHeight = height;
		});
		observer.observe(ref.current);

		return () => {
			if (isResized) resize(currentHeight);
			currentHeight = 0;
			observer.disconnect();
		};
	}, [onInitHeightSet, resize]);

	return (
		<div ref={ref} className={styles.row} style={{ transform: `translate3d(0, ${offset}px, 0)` }}>
			{children}
		</div>
	);
};
