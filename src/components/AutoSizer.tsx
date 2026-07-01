import { ReactNode } from 'react';
import { useAutoSize, UseAutoSizeProps } from 'hooks/useAutoSize';

type AutoSizerProps = UseAutoSizeProps & {
	children: ReactNode;
	offset: number;
};

export const AutoSizer = ({ offset, onMount, onResize, children }: AutoSizerProps) => {
	const ref = useAutoSize({ onResize, onMount });
	return (
		<div ref={ref} style={{ position: 'absolute', transform: `translate3d(0, ${offset}px, 0)` }}>
			{children}
		</div>
	);
};
