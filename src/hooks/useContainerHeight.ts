import { useLayoutEffect, useRef, useState } from 'react';

export const useContainerHeight = () => {
	const [containerHeight, setContainerHeight] = useState<number>(0);
	const container = useRef<HTMLDivElement>(null);

	useLayoutEffect(() => {
		if (!container.current) return;
		setContainerHeight(container.current.clientHeight);
	}, []);

	return { containerHeight, container };
};
