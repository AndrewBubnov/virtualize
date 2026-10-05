import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { ScrollToForm } from './ScrollToForm';

const columnHelper = createColumnHelper<User>();

const columns = [
	columnHelper.display({
		id: 'expand',
		size: 40,
		cell: ({ row }) => (
			<button onClick={() => row.toggleExpanded()} className="vtable-expand-button">
				{row.getIsExpanded() ? '▼' : '▶'}
			</button>
		),
	}),
	columnHelper.accessor('id', { header: 'ID', size: 50 }),
	columnHelper.accessor('name', { header: 'Name', size: 150 }),
	// columnHelper.accessor('email', { header: 'Email', size: 200 }),
	columnHelper.accessor('role', { header: 'Role', size: 100 }),
	columnHelper.accessor('bio', { header: 'Bio' }),
];

const ExpandedContent = ({ row }: { row: Row<User> }) => (
	<div className="vtable-expanded">
		<strong>Details:</strong> {expandedDetails(row.original.id)}
	</div>
);

export const VirtualTable = ({ count }: { count: number }) => {
	const [expanded, setExpanded] = useState<Record<string, boolean>>({});
	const [bodyEl, setBodyEl] = useState<HTMLDivElement | null>(null);
	const headInnerRef = useRef<HTMLDivElement>(null);
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

	const { virtualItems, scrollHeight, scrollRef, getMeasureRef, scrollToIndex } = useVirtualizer({
		count: rows.length,
		estimateSize: () => 44,
		overscan: 10,
	});

	const totalWidth = table.getAllLeafColumns().reduce((sum, column) => sum + column.getSize(), 0);

	const setBodyRef = useCallback(
		(element: HTMLDivElement | null) => {
			scrollRef(element);
			setBodyEl(element);
		},
		[scrollRef]
	);

	useEffect(() => {
		if (!bodyEl) return;
		const syncHeader = () => {
			if (headInnerRef.current) headInnerRef.current.style.transform = `translateX(${-bodyEl.scrollLeft}px)`;
		};
		syncHeader();
		bodyEl.addEventListener('scroll', syncHeader, { passive: true });
		return () => bodyEl.removeEventListener('scroll', syncHeader);
	}, [bodyEl]);

	return (
		<>
			<div className="vtable-head-clip">
				<div ref={headInnerRef} className="vtable-header">
					{table.getHeaderGroups().map(headerGroup => (
						<div key={headerGroup.id} className="vtable-header-group">
							{headerGroup.headers.map(header => (
								<div key={header.id} className="vtable-cell" style={{ width: header.getSize() }}>
									{flexRender(header.column.columnDef.header, header.getContext())}
								</div>
							))}
						</div>
					))}
				</div>
			</div>
			<div ref={setBodyRef} className="scroll-box scroll-box-flush-top" style={{ height: 220 }}>
				<div className="scroll-box-inner" style={{ height: scrollHeight, minWidth: totalWidth }}>
					{virtualItems.map(virtualRow => {
						const row = rows[virtualRow.index];
						return (
							<div
								key={row.id}
								ref={getMeasureRef(virtualRow.index)}
								className="vtable-row"
								style={{
									position: 'absolute',
									top: 0,
									left: 0,
									width: totalWidth,
									transform: `translateY(${virtualRow.start}px)`,
								}}
							>
								<div className="vtable-row-body">
									{row.getVisibleCells().map(cell => (
										<div
											key={cell.id}
											className="vtable-cell"
											style={{ width: cell.column.getSize() }}
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
			<ScrollToForm count={rows.length} onJump={(index, align) => scrollToIndex(index, { align })} />
		</>
	);
};
