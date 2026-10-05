import type { CSSProperties, ReactNode } from 'react';
import { useVirtualizer } from 'clear-virtualizer';

export type VirtualizedListProps = {
	count: number;
	renderItem: (index: number) => ReactNode;
	height: CSSProperties['height'];
	estimateSize?: (index: number) => number;
	overscan?: number;
};

export const VirtualizedList = ({ count, renderItem, height, overscan, estimateSize }: VirtualizedListProps) => {
	const { virtualItems, scrollHeight, scrollRef, getMeasureRef } = useVirtualizer({
		count,
		estimateSize,
		overscan,
	});

	return (
		<div ref={scrollRef} style={{ height, overflow: 'auto', lineHeight: 1.5, border: '1px solid #ddd', borderRadius: 4 }}>
			<div style={{ position: 'relative', height: scrollHeight }}>
				{virtualItems.map(item => (
					<div
						key={item.index}
						ref={getMeasureRef(item.index)}
						style={{
							position: 'absolute',
							top: 0,
							left: 0,
							width: '100%',
							transform: `translateY(${item.start}px)`,
						}}
					>
						{renderItem(item.index)}
					</div>
				))}
			</div>
		</div>
	);
};
