import { CSSProperties, ReactNode } from 'react';
import { AutoSizer } from 'components/AutoSizer';
import { useVirtualize } from 'hooks/useVirtualize';

export type VirtualizedProps = {
	children: ReactNode[];
	height: CSSProperties['height'];
	width: CSSProperties['width'];
	className?: string;
	style?: CSSProperties;
	overScan?: number;
};

const OVER_SCAN = 2;

export const Virtualized = ({ children, height, width, className, style, overScan = OVER_SCAN }: VirtualizedProps) => {
	const { rows, mountHandler, resizeHandler, scrollHeight, containerRef, scrollHandler } = useVirtualize(
		children,
		overScan
	);
	return (
		<div
			onScroll={scrollHandler}
			ref={containerRef}
			style={{ height, width, position: 'relative', overflow: 'auto', lineHeight: 1.5, ...style }}
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
