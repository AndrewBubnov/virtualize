import { CSSProperties, ReactNode } from 'react';
import { useVirtualizer } from '../hooks/useVirtualizer';

export type VirtualizeListProps = {
	count: number;
	renderItem: (index: number) => ReactNode;
	height: CSSProperties['height'];
	estimateSize?: (index: number) => number;
	children?: (onClick: (index: number) => void) => ReactNode;
	className?: string;
	overscan?: number;
	width?: CSSProperties['width'];
	style?: CSSProperties;
};

export const VirtualizedList = ({
	count,
	renderItem,
	height,
	className,
	style,
	overscan,
	estimateSize,
	children,
	width = 'auto',
}: VirtualizeListProps) => {
	const { virtualItems, scrollHeight, scrollRef, getMeasureRef, scrollToIndex } = useVirtualizer({
		count,
		estimateSize,
		overscan,
	});

	return (
		<>
			{children?.(scrollToIndex)}
			<div
				ref={scrollRef}
				style={{ height, width, overflow: 'auto', lineHeight: 1.5, ...style }}
				className={className}
			>
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
		</>
	);
};
