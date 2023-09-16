import { useLayoutEffect, useRef } from 'react';
import { AutoSizerProps } from 'types.ts';
import styles from './AutoSizer.module.css';

export const AutoSizer = ({ offset, onHeightSet, children }: AutoSizerProps) => {
	const ref = useRef<HTMLDivElement | null>(null);
	const onHeightSetRef = useRef<(height: number) => void>(onHeightSet);

	useLayoutEffect(() => onHeightSetRef.current(ref.current?.clientHeight || 0), [onHeightSet]);

	return (
		<div ref={ref} className={styles.row} style={{ transform: `translate3d(0, ${offset}px, 0)` }}>
			{children}
		</div>
	);
};
