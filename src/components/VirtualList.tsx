import { CSSProperties, ReactNode } from 'react';
import { useVirtualizer } from 'hooks/useVirtualizer';

export type VirtualListProps = {
	children: ReactNode[];
	height: CSSProperties['height'];
	width?: CSSProperties['width'];
	rowHeight: number;
	overscan?: number;
	className?: string;
	style?: CSSProperties;
};

export const VirtualList = ({ children, height, width = '100%', rowHeight, overscan = 3, className, style }: VirtualListProps) => {
	const { virtualItems, scrollHeight, scrollRef } = useVirtualizer({
		count: children.length,
		estimateSize: () => rowHeight,
		overscan,
	});

	return (
		<div
			ref={scrollRef}
			style={{ height, width, overflow: 'auto', ...style }}
			className={className}
		>
			<div style={{ position: 'relative', height: scrollHeight }}>
				{virtualItems.map(virtualRow => (
					<div
						key={virtualRow.index}
						style={{
							position: 'absolute',
							top: 0,
							left: 0,
							width: '100%',
							height: virtualRow.size,
							transform: `translateY(${virtualRow.start}px)`,
						}}
					>
						{children[virtualRow.index]}
					</div>
				))}
			</div>
		</div>
	);
};
