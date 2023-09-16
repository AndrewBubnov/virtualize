import { useLayoutEffect, useRef } from 'react';
import { AutoSizerProps } from 'types.ts';
import styles from './AutoSizer.module.css';

export const AutoSizer = ({ offset, onHeightSet, children, dataIndex }: AutoSizerProps) => {
	const ref = useRef<HTMLDivElement | null>(null);

	useLayoutEffect(() => onHeightSet(ref.current?.clientHeight || 0), [onHeightSet]);

	return (
		<div
			ref={ref}
			className={styles.row}
			style={{ transform: `translate3d(0, ${offset}px, 0)` }}
			data-index={dataIndex}
		>
			{children}
		</div>
	);
};
