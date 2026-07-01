import { CSSProperties, ReactNode } from 'react';
import { AutoSizer } from 'components/AutoSizer.tsx';
import { useVirtualize } from 'hooks/useVirtualize.ts';

export interface VirtualizedProps {
	children: ReactNode[];
	height: CSSProperties['height'];
	width: CSSProperties['width'];
	className?: string;
}

export const Virtualized = ({ children, height, width, className }: VirtualizedProps) => {
	const { rows, mountHandler, resizeHandler, scrollHeight, containerRef, scrollHandler } = useVirtualize(children);
	return (
		<div
			onScroll={scrollHandler}
			ref={containerRef}
			style={{ height, width, position: 'relative', overflow: 'auto', lineHeight: 1.5 }}
			className={className}
		>
			<div style={{ height: `${scrollHeight}px` }}>
				{rows.map(el => (
					<AutoSizer
						key={el.index}
						offset={el.transform}
						onMount={mountHandler(el.index)}
						onResize={resizeHandler(el.index)}
					>
						{el.content}
					</AutoSizer>
				))}
			</div>
		</div>
	);
};
