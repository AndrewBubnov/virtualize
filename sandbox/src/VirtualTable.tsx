import { useMemo, useState } from 'react';
import {
	useReactTable,
	getCoreRowModel,
	getExpandedRowModel,
	flexRender,
	createColumnHelper,
	type Row,
} from '@tanstack/react-table';
import { useVirtualizer } from 'clear-virtualizer';
import { expandedDetails, makeUsers, type User } from './data';

const columnHelper = createColumnHelper<User>();

const columns = [
	columnHelper.display({
		id: 'expand',
		size: 40,
		cell: ({ row }) => (
			<button
				onClick={() => row.toggleExpanded()}
				style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: '4px 8px' }}
			>
				{row.getIsExpanded() ? '▼' : '▶'}
			</button>
		),
	}),
	columnHelper.accessor('id', { header: 'ID', size: 60 }),
	columnHelper.accessor('name', { header: 'Name', size: 150 }),
	columnHelper.accessor('email', { header: 'Email', size: 200 }),
	columnHelper.accessor('role', { header: 'Role', size: 100 }),
	columnHelper.accessor('bio', { header: 'Bio' }),
];

const ExpandedContent = ({ row }: { row: Row<User> }) => (
	<div style={{ padding: '8px 16px', background: '#fafafa', borderTop: '1px solid #eee', fontSize: 13, color: '#555' }}>
		<strong>Details:</strong> {expandedDetails(row.original.id)}
	</div>
);

export const VirtualTable = ({ count }: { count: number }) => {
	const [expanded, setExpanded] = useState<Record<string, boolean>>({});
	const data = useMemo(() => makeUsers(count), [count]);

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
		<div ref={scrollRef} style={{ height: 550, overflow: 'auto', border: '1px solid #ddd', borderRadius: 4 }}>
			<div style={{ position: 'relative', height: scrollHeight }}>
				{table.getHeaderGroups().map(headerGroup => (
					<div
						key={headerGroup.id}
						style={{
							position: 'sticky',
							top: 0,
							zIndex: 1,
							display: 'flex',
							background: '#f5f5f5',
							fontWeight: 600,
							borderBottom: '2px solid #ddd',
						}}
					>
						{headerGroup.headers.map(header => (
							<div key={header.id} style={{ width: header.getSize(), padding: '8px 12px', flexShrink: 0 }}>
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
								borderBottom: '1px solid #eee',
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
							{row.getIsExpanded() && <ExpandedContent row={row} />}
						</div>
					);
				})}
			</div>
		</div>
	);
};
