import { CSSProperties, ReactNode, useMemo } from 'react';
import { AutoSizer } from 'components/AutoSizer';
import { useVirtualize } from 'hooks/useVirtualize';

export type Column<T> = {
	key: string;
	header: ReactNode;
	width?: number | string;
	align?: 'left' | 'center' | 'right';
	render?: (row: T, index: number) => ReactNode;
};

export type VirtualizedTableProps<T> = {
	columns: Column<T>[];
	rows: T[];
	height: CSSProperties['height'];
	width?: CSSProperties['width'];
	rowKey?: (row: T, index: number) => string | number;
	overScan?: number;
	className?: string;
	style?: CSSProperties;
};

const OVER_SCAN = 3;

export function VirtualizedTable<T>({
	columns,
	rows,
	height,
	width = '100%',
	rowKey,
	overScan = OVER_SCAN,
	className,
	style,
}: VirtualizedTableProps<T>) {
	const gridTemplateColumns = useMemo(
		() =>
			columns
				.map(col => {
					if (col.width !== undefined) {
						return typeof col.width === 'number' ? `${col.width}px` : col.width;
					}
					return '1fr';
				})
				.join(' '),
		[columns]
	);

	const items = useMemo(
		() =>
			rows.map((row, index) => (
				<div
					key={rowKey ? rowKey(row, index) : index}
					style={{ display: 'grid', gridTemplateColumns, borderBottom: '1px solid #eee' }}
					data-row-index={index}
				>
					{columns.map(col => (
						<div key={col.key} style={{ padding: '8px 12px', textAlign: col.align ?? 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
							{col.render ? col.render(row, index) : String((row as Record<string, unknown>)[col.key] ?? '')}
						</div>
					))}
				</div>
			)),
		[rows, columns, gridTemplateColumns, rowKey]
	);

	const { rows: visibleRows, mountHandler, resizeHandler, scrollHeight, containerRef, scrollHandler } =
		useVirtualize(items, overScan);

	return (
		<div
			onScroll={scrollHandler}
			ref={containerRef}
			style={{ height, width, overflow: 'auto', ...style }}
			className={className}
		>
			<div
				style={{
					position: 'sticky',
					top: 0,
					zIndex: 1,
					display: 'grid',
					gridTemplateColumns,
					background: '#f5f5f5',
					fontWeight: 600,
					borderBottom: '2px solid #ddd',
				}}
			>
				{columns.map(col => (
					<div key={col.key} style={{ padding: '8px 12px', textAlign: col.align ?? 'left' }}>
						{col.header}
					</div>
				))}
			</div>

			<div style={{ position: 'relative', height: `${scrollHeight}px` }}>
				{visibleRows.map(el => (
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
}
