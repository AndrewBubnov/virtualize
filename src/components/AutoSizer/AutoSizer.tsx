import { CSSProperties } from 'react';
import { useAutoSize } from 'hooks/useAutoSize.ts';
import { AutoSizerProps } from 'types.ts';
import styles from './AutoSizer.module.css';

export const AutoSizer = ({ offset, onMount, onResize, children }: AutoSizerProps) => {
	const ref = useAutoSize({ onResize, onMount });
	return (
		<div ref={ref} className={styles.row} style={{ '--offset': `${offset}px` } as CSSProperties}>
			{children}
		</div>
	);
};
