import { useLayoutEffect, useRef } from 'react';
import { useFirstRefMemo } from 'hooks/useFirstRefMemo.ts';
import { UseAutoSizeProps } from 'types.ts';

export const useAutoSize = ({ onResize, onInitHeightSet }: UseAutoSizeProps) => {
	const ref = useRef<HTMLDivElement | null>(null);
	const resize = useFirstRefMemo<(height: number) => void>(onResize);
	const setInitHeight = useFirstRefMemo<(height: number) => void>(onInitHeightSet);

	useLayoutEffect(() => {
		if (!ref.current) return;
		let initHeight = 0;
		let isResized = false;
		const observer = new ResizeObserver(([entry]) => {
			const height = entry.borderBoxSize[0].blockSize;
			if (initHeight) {
				resize(height);
				isResized = true;
				return;
			}
			setInitHeight(height);
			initHeight = height;
		});
		observer.observe(ref.current);

		return () => {
			if (isResized) resize(initHeight);
			observer.disconnect();
		};
	}, [resize, setInitHeight]);

	return ref;
};
