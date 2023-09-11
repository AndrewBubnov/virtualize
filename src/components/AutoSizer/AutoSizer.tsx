import { ReactNode, useLayoutEffect, useRef } from 'react';
import styles from './AutoSizer.module.css';

interface AutoSizerProps {
	children: ReactNode;
	offset: number;
	heightSetter(height: number): void;
}

export const AutoSizer = ({ offset, heightSetter, children }: AutoSizerProps) => {
	const ref = useRef<HTMLDivElement | null>(null);

	useLayoutEffect(() => heightSetter(ref.current?.clientHeight || 0), [heightSetter]);

	return (
		<div className={styles.row} style={{ transform: `translate3d(0, ${offset}px, 0)` }} ref={ref}>
			{children}
		</div>
	);
};
