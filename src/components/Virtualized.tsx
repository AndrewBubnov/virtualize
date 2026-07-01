import { CSSProperties, ReactNode } from 'react';
import { AutoSizer } from 'components/AutoSizer';
import { useVirtualize } from 'hooks/useVirtualize';

export type VirtualizedProps = {
	children: ReactNode[];
	height: CSSProperties['height'];
	width?: CSSProperties['width'];
	className?: string;
	style?: CSSProperties;
	overScan?: number;
};

const OVER_SCAN = 3;

export const Virtualized = ({
	children,
	height,
	className,
	style,
	overScan = OVER_SCAN,
	width = 'auto',
}: VirtualizedProps) => {
	const { rows, mountHandler, resizeHandler, scrollHeight, containerRef, scrollHandler } = useVirtualize(
		children,
		overScan
	);
	return (
		<div
			onScroll={scrollHandler}
			ref={containerRef}
			style={{ height, width, overflow: 'auto', lineHeight: 1.5, ...style }}
			className={className}
		>
			<div style={{ position: 'relative', height: `${scrollHeight}px` }}>
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
