[![npm version](https://img.shields.io/npm/v/clear-virtualizer.svg)(https://www.npmjs.com/package/clear-virtualizer)

# clear-virtualizer

One hook for vertical virtualized lists and tables with dynamic row heights. Rows are measured automatically via `ResizeObserver` — no manual measuring, no fixed heights. Works for an unlimited number of rows.

## Install

```sh
npm i clear-virtualizer
```

## Exports

```ts
import { useVirtualizer, type Options, type ScrollAlign, type VirtualItem } from 'clear-virtualizer';
```

## API

```ts
const { virtualItems, scrollHeight, scrollRef, getMeasureRef, scrollToIndex } = useVirtualizer({
  count: 100000,
  estimateSize: () => 44,
  overscan: 10,
});
```

| Option         | Type                                       | Description                                              |
| -------------- |--------------------------------------------| -------------------------------------------------------- |
| `count`        | `number`                                   | Total number of rows                                     |
| `estimateSize` | `((index: number) => number) \| undefined` | Approximate row height in px, used until a row is measured |
| `overscan`     | `number \| undefined`                      | Extra rows rendered above/below the viewport (default: 3) |

| Return value    | Type                                          | Description                                             |
| --------------- | --------------------------------------------- | ------------------------------------------------------- |
| `virtualItems`  | `VirtualItem[]`                               | Rows to render: `{ index, start, size, end }` (px)      |
| `scrollHeight`  | `number`                                      | Total scrollable height (px)                            |
| `scrollRef`     | `(el: HTMLElement \| null) => void`           | Callback ref — attach to the scroll container           |
| `getMeasureRef` | `(index: number) => (el: HTMLElement \| null) => void` | Attach the returned ref to each row for measuring |
| `scrollToIndex` | `(index: number, options?: { align?: ScrollAlign }) => void` | Scroll to a row |

Do not set a fixed `height` on rows — let them size naturally so `getMeasureRef` measures the real height. Position rows with `transform: translateY(...)`.

## List example

```tsx
import { CSSProperties, ReactNode } from 'react';
import { useVirtualizer } from 'clear-virtualizer';

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

export const VirtualizedList = ({
	count,
	renderItem,
	height,
	className,
	style,
	overscan,
	estimateSize,
	width = 'auto',
}: VirtualizeListProps) => {
	const { virtualItems, scrollHeight, scrollRef, getMeasureRef } = useVirtualizer({
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
```

## Table example (with @tanstack/react-table and expandable rows)

Column widths must be set on both header and body cells (`header.getSize()` / `cell.column.getSize()` with `flexShrink: 0`) so columns stay aligned. The header is `position: sticky`. Expanding a row changes its height — it gets re-measured automatically.

```tsx
import { useState } from 'react';
import {
	useReactTable,
	getCoreRowModel,
	getExpandedRowModel,
	flexRender,
	createColumnHelper,
} from '@tanstack/react-table';
import { useVirtualizer } from 'clear-virtualizer';

type User = { id: number; name: string; email: string; role: string };

const data: User[] = Array.from({ length: 100_000 }, (_, i) => ({
	id: i + 1,
	name: `User ${i + 1}`,
	email: `user${i + 1}@example.com`,
	role: ['Admin', 'Editor', 'Viewer'][i % 3],
}));

const columnHelper = createColumnHelper<User>();

const columns = [
	columnHelper.display({
		id: 'expand',
		size: 40,
		cell: ({ row }) => (
			<button onClick={() => row.toggleExpanded()}>{row.getIsExpanded() ? '▼' : '▶'}</button>
		),
	}),
	columnHelper.accessor('id', { header: 'ID', size: 60 }),
	columnHelper.accessor('name', { header: 'Name', size: 150 }),
	columnHelper.accessor('email', { header: 'Email', size: 200 }),
	columnHelper.accessor('role', { header: 'Role', size: 100 }),
];

export const VirtualTable = () => {
	const [expanded, setExpanded] = useState<Record<string, boolean>>({});
	const table = useReactTable({
		data,
		columns,
		state: { expanded },
		onExpandedChange: old => setExpanded(old as Record<string, boolean>),
		getExpandedRowModel: getExpandedRowModel(),
		getCoreRowModel: getCoreRowModel(),
	});
	const rows = table.getRowModel().rows;
	const { virtualItems, scrollHeight, scrollRef, getMeasureRef } = useVirtualizer({
		count: rows.length,
		estimateSize: () => 44,
		overscan: 10,
	});

	return (
		<div ref={scrollRef} style={{ height: 550, overflow: 'auto' }}>
			<div style={{ position: 'relative', height: scrollHeight }}>
				{table.getHeaderGroups().map(headerGroup => (
					<div
						key={headerGroup.id}
						style={{ position: 'sticky', top: 0, zIndex: 1, display: 'flex', background: '#f5f5f5' }}
					>
						{headerGroup.headers.map(header => (
							<div
								key={header.id}
								style={{ width: header.getSize(), padding: '8px 12px', flexShrink: 0 }}
							>
								{flexRender(header.column.columnDef.header, header.getContext())}
							</div>
						))}
					</div>
				))}
				{virtualItems.map(virtualRow => {
					const row = rows[virtualRow.index];
					return (
						<div
							key={row.id}
							ref={getMeasureRef(virtualRow.index)}
							style={{
								position: 'absolute',
								top: 0,
								left: 0,
								width: '100%',
								transform: `translateY(${virtualRow.start}px)`,
							}}
						>
							<div style={{ display: 'flex' }}>
								{row.getVisibleCells().map(cell => (
									<div
										key={cell.id}
										style={{ width: cell.column.getSize(), padding: '8px 12px', flexShrink: 0 }}
									>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</div>
								))}
							</div>
							{row.getIsExpanded() && (
								<div style={{ padding: '8px 16px' }}>Details for {row.original.name}</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
};
```

## scrollToIndex

```ts
scrollToIndex(34567); // align defaults to 'start'
scrollToIndex(34567, { align: 'center' });
scrollToIndex(34567, { align: 'end' });
```

| `align`  | Positions the row...              |
| -------- | --------------------------------- |
| `start`  | At the top of the viewport (default) |
| `center` | In the middle of the viewport     |
| `end`    | At the bottom of the viewport     |

If the row is far away and its neighbors were never measured, the hook first jumps to the estimated position, measures the rows around the target, and corrects the position. A manual scroll during that correction cancels it and hands control back to the user.

## estimateSize

`estimateSize` is only a starting guess until real measurements arrive. The closer it is to reality, the less rows visually shift on fast scroll through unmeasured regions: underestimated rows overlap until measured, overestimated ones leave temporary gaps. Pass a value near your average row height.

## Limitations

- Vertical scrolling only — no horizontal virtualization, no sticky columns.
- The internal offset tree keeps one `float64` per row (~8 MB per million rows).
- Server-side rendering is not covered by tests.

## License

MIT
