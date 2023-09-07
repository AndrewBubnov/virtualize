import styles from '../Vitrualized/Virtualized.module.css';
import { useLayoutEffect, useRef } from 'react';

interface AutoSizerProps {
	element: {
		text: string;
		transform: number;
	};
	resizeHandler(height: number): void;
}

export const AutoSizer = ({ element, resizeHandler }: AutoSizerProps) => {
	const ref = useRef<HTMLDivElement | null>(null);

	useLayoutEffect(() => {
		if (!ref.current) return;
		resizeHandler(ref.current.clientHeight);
	}, [resizeHandler]);

	return (
		<div className={styles.row} style={{ transform: `translate3d(0, ${element.transform}px, 0)` }} ref={ref}>
			{element.text}
		</div>
	);
};
