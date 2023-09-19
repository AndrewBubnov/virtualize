import { useLayoutEffect, useRef } from 'react';
import { AutoSizerProps } from 'types.ts';
import { useFirstRefMemo } from 'hooks/useFirstRefMemo.ts';
import styles from './AutoSizer.module.css';

export const AutoSizer = ({ offset, onInitHeightSet, onResize, children }: AutoSizerProps) => {
	const ref = useRef<HTMLDivElement | null>(null);
	const resize = useFirstRefMemo<(height: number) => void>(onResize);
	const setInitHeight = useFirstRefMemo<(height: number) => void>(onInitHeightSet);

	useLayoutEffect(() => {
		if (!ref.current) return;
		let initHeight = 0;
		let isResized = false;
		const observer = new ResizeObserver(([entry]) => {
			const height = entry.borderBoxSize[0].blockSize;
			if (initHeight) {
				resize(height);
				isResized = true;
				return;
			}
			setInitHeight(height);
			initHeight = height;
		});
		observer.observe(ref.current);

		return () => {
			if (isResized) resize(initHeight);
			observer.disconnect();
		};
	}, [resize, setInitHeight]);

	return (
		<div ref={ref} className={styles.row} style={{ transform: `translate3d(0, ${offset}px, 0)` }}>
			{children}
		</div>
	);
};
