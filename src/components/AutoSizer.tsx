import { useAutoSize } from 'hooks/useAutoSize.ts';
import { AutoSizerProps } from 'types.ts';

export const AutoSizer = ({ offset, onMount, onResize, children }: AutoSizerProps) => {
	const ref = useAutoSize({ onResize, onMount });
	return (
		<div ref={ref} style={{ position: 'absolute', transform: `translate3d(0, ${offset}px, 0)` }}>
			{children}
		</div>
	);
};
