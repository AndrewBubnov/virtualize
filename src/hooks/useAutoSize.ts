import { useLayoutEffect, useRef } from 'react';
import { UseAutoSizeProps } from 'types.ts';

export const useAutoSize = ({ onResize, onMount }: UseAutoSizeProps) => {
	const ref = useRef<HTMLDivElement>(null);
	const initHeight = useRef<number>(0);

	useLayoutEffect(() => {
		const height = ref.current?.clientHeight || 0;
		initHeight.current = height;
		onMount(height);
	}, [onMount]);

	useLayoutEffect(() => {
		if (!ref.current) return;
		const { current: divRef } = ref;
		const observer = new ResizeObserver(([entry]) => {
			const height = entry.borderBoxSize[0].blockSize;
			if (initHeight.current && initHeight.current !== height) onResize(height);
		});
		observer.observe(divRef);

		return () => {
			if (divRef.clientHeight !== initHeight.current) onResize(initHeight.current);
			observer.disconnect();
		};
	}, [onResize]);

	return ref;
};
