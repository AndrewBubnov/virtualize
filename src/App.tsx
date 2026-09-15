import { useReactTable, getCoreRowModel, flexRender, createColumnHelper } from '@tanstack/react-table';
import { useVirtualizer } from './hooks/useVirtualizer';

type User = {
	id: number;
	name: string;
	email: string;
	role: string;
	status: 'active' | 'inactive';
};

const roles = ['Admin', 'Editor', 'Viewer', 'Manager', 'Developer'];
const firstNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Hank', 'Ivy', 'Jack'];
const lastNames = [
	'Smith',
	'Johnson',
	'Williams',
	'Brown',
	'Jones',
	'Garcia',
	'Miller',
	'Davis',
	'Rodriguez',
	'Martinez',
];

const tableData: User[] = Array.from({ length: 100_000 }, (_, i) => ({
	id: i + 1,
	name: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
	email: `user${i + 1}@example.com`,
	role: roles[i % roles.length],
	status: i % 3 === 0 ? 'inactive' : 'active',
}));

const columnHelper = createColumnHelper<User>();

const columns = [
	columnHelper.accessor('id', { header: 'ID', size: 70 }),
	columnHelper.accessor('name', { header: 'Name', size: 180 }),
	columnHelper.accessor('email', { header: 'Email', size: 220 }),
	columnHelper.accessor('role', { header: 'Role', size: 120 }),
	columnHelper.accessor('status', {
		header: 'Status',
		size: 100,
		cell: info => (
			<span style={{ color: info.getValue() === 'active' ? 'green' : 'red', fontWeight: 600 }}>
				{info.getValue()}
			</span>
		),
	}),
];

const VirtualTable = () => {
	const table = useReactTable({
		data: tableData,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	const rows = table.getRowModel().rows;

	const rowVirtualizer = useVirtualizer({
		count: rows.length,
		getScrollElement: () => document.getElementById('table-scroll'),
		estimateSize: () => 44,
		overscan: 10,
	});

	return (
		<div
			id="table-scroll"
			ref={rowVirtualizer.scrollRef}
			style={{ height: 550, overflow: 'auto', border: '1px solid #ddd', borderRadius: 4 }}
		>
			<div style={{ position: 'relative', height: rowVirtualizer.getTotalSize() }}>
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
							<div
								key={header.id}
								style={{ width: header.getSize(), padding: '8px 12px', flexShrink: 0 }}
							>
								{flexRender(header.column.columnDef.header, header.getContext())}
							</div>
						))}
					</div>
				))}

				{rowVirtualizer.getVirtualItems().map(virtualRow => {
					const row = rows[virtualRow.index];
					return (
						<div
							key={row.id}
							style={{
								position: 'absolute',
								top: 0,
								left: 0,
								width: '100%',
								height: virtualRow.size,
								transform: `translateY(${virtualRow.start}px)`,
								display: 'flex',
								borderBottom: '1px solid #eee',
							}}
						>
							{row.getVisibleCells().map(cell => (
								<div
									key={cell.id}
									style={{
										width: cell.column.getSize(),
										padding: '8px 12px',
										flexShrink: 0,
										overflow: 'hidden',
										textOverflow: 'ellipsis',
										whiteSpace: 'nowrap',
									}}
								>
									{flexRender(cell.column.columnDef.cell, cell.getContext())}
								</div>
							))}
						</div>
					);
				})}
			</div>
		</div>
	);
};

const App = () => (
	<div style={{ display: 'flex', flexDirection: 'column', gap: 32, padding: 24 }}>
		<VirtualTable />
	</div>
);

export default App;
