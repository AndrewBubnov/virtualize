import { ReactNode, useLayoutEffect, useRef } from 'react';
import styles from './AutoSizer.module.css';

interface AutoSizerProps {
	children: ReactNode;
	offset: number;
	onHeightSet(height: number): void;
}

export const AutoSizer = ({ offset, onHeightSet, children }: AutoSizerProps) => {
	const ref = useRef<HTMLDivElement | null>(null);
	const onHeightSetRef = useRef<(height: number) => void>(onHeightSet);

	useLayoutEffect(() => onHeightSetRef.current(ref.current?.clientHeight || 0), []);

	return (
		<div className={styles.row} style={{ transform: `translate3d(0, ${offset}px, 0)` }} ref={ref}>
			{children}
		</div>
	);
};
