import { CSSProperties, ReactNode } from 'react';
import { useVirtualizer } from '../hooks/useVirtualizer';

export type VirtualizeListProps = {
	count: number;
	renderItem: (index: number) => ReactNode;
	height: CSSProperties['height'];
	estimateSize?: (index: number) => number;
	className?: string;
	overscan?: number;
	width?: CSSProperties['width'];
	style?: CSSProperties;
};

export const Virtualize = ({
	count,
	renderItem,
	height,
	className,
	style,
	overscan,
	estimateSize,
	width = 'auto',
}: VirtualizeListProps) => {
	const { virtualItems, scrollHeight, scrollRef, measureElement } = useVirtualizer({
		count,
		estimateSize,
		overscan,
	});

	return (
		<div
			ref={scrollRef}
			style={{ height, width, overflow: 'auto', lineHeight: 1.5, ...style }}
			className={className}
		>
			<div style={{ position: 'relative', height: scrollHeight }}>
				{virtualItems.map(item => (
					<div
						key={item.index}
						ref={el => measureElement(el, item.index)}
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
