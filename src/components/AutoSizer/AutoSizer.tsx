import styles from './AutoSizer.module.css';
import { useLayoutEffect, useRef } from 'react';

interface AutoSizerProps {
	element: {
		text: string;
		transform: number;
	};
	heightSetter(height: number): void;
}

export const AutoSizer = ({ element, heightSetter }: AutoSizerProps) => {
	const ref = useRef<HTMLDivElement | null>(null);

	useLayoutEffect(() => heightSetter(ref.current?.clientHeight || 0), [heightSetter]);

	return (
		<div className={styles.row} style={{ transform: `translate3d(0, ${element.transform}px, 0)` }} ref={ref}>
			{element.text}
		</div>
	);
};
