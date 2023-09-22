import { useLayoutEffect, useRef, useState } from 'react';

export const useContainerHeight = () => {
	const [containerHeight, setContainerHeight] = useState<number>(0);
	const containerRef = useRef<HTMLDivElement>(null);

	useLayoutEffect(() => {
		if (!containerRef.current) return;
		setContainerHeight(containerRef.current.clientHeight);
	}, []);

	return { containerHeight, containerRef };
};
