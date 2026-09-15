import { useState } from 'react';
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper, Row } from '@tanstack/react-table';
import { useVirtualizer } from './hooks/useVirtualizer';

type User = {
	id: number;
	name: string;
	email: string;
	role: string;
	status: 'active' | 'inactive';
	bio: string;
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

const bios = [
	'Senior engineer',
	'Full-stack developer with 10 years of experience in distributed systems and cloud architecture',
	'Frontend specialist focused on React and TypeScript',
	'DevOps engineer managing CI/CD pipelines and infrastructure',
	'Junior developer eager to learn',
	'Tech lead overseeing a team of 8 developers across multiple projects and time zones',
	'QA engineer',
	'Product-minded engineer building user-centric features',
];

const details = [
	'No additional details available.',
	'Works on the core platform team. Responsibilities include architecture decisions, code reviews, and mentoring junior developers. Currently focused on migrating the monolith to microservices.',
	'Joined the company in 2022. Previously worked at a startup building a real-time collaboration tool.',
	'Manages the CI/CD pipeline using GitHub Actions and Terraform. Reduced deploy time by 40%.',
	'First job out of bootcamp. Learning TypeScript and React.',
	'Has been with the company since the beginning. Built the original data pipeline and now leads a team of 8.',
	'Runs the QA automation suite. Reduced manual regression testing from 3 days to 2 hours.',
	'Works cross-functionally with design and product to ship user-facing features.',
];

const tableData: User[] = Array.from({ length: 100_000 }, (_, i) => ({
	id: i + 1,
	name: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
	email: `user${i + 1}@example.com`,
	role: roles[i % roles.length],
	status: i % 3 === 0 ? 'inactive' : 'active',
	bio: bios[i % bios.length],
}));

const columnHelper = createColumnHelper<User>();

const ExpandedContent = ({ row }: { row: Row<User> }) => (
	<div style={{ padding: '8px 16px', background: '#fafafa', borderTop: '1px solid #eee', fontSize: 13, color: '#555' }}>
		<strong>Details:</strong> {details[row.original.id % details.length]}
	</div>
);

const columns = [
	columnHelper.display({
		id: 'expand',
		size: 40,
		cell: ({ row }) => (
			<button
				onClick={() => row.toggleExpanded()}
				style={{
					background: 'none',
					border: 'none',
					cursor: 'pointer',
					fontSize: 14,
					padding: '4px 8px',
				}}
			>
				{row.getIsExpanded() ? '▼' : '▶'}
			</button>
		),
	}),
	columnHelper.accessor('id', { header: 'ID', size: 60 }),
	columnHelper.accessor('name', { header: 'Name', size: 150 }),
	columnHelper.accessor('email', { header: 'Email', size: 200 }),
	columnHelper.accessor('role', { header: 'Role', size: 100 }),
	columnHelper.accessor('status', {
		header: 'Status',
		size: 80,
		cell: info => (
			<span style={{ color: info.getValue() === 'active' ? 'green' : 'red', fontWeight: 600 }}>
				{info.getValue()}
			</span>
		),
	}),
	columnHelper.accessor('bio', { header: 'Bio' }),
];

const VirtualTable = () => {
	const [expanded, setExpanded] = useState<Record<string, boolean>>({});

	const table = useReactTable({
		data: tableData,
		columns,
		state: { expanded },
		onExpandedChange: old => setExpanded(old as Record<string, boolean>),
		getExpandedRowModel: getCoreRowModel(),
		getCoreRowModel: getCoreRowModel(),
	});

	const rows = table.getRowModel().rows;

	const rowVirtualizer = useVirtualizer({
		count: rows.length,
		estimateSize: () => 44,
		overscan: 10,
	});

	return (
		<div
			id="table-scroll"
			ref={rowVirtualizer.scrollRef}
			style={{ height: 550, overflow: 'auto', border: '1px solid #ddd', borderRadius: 4 }}
		>
			<div style={{ position: 'relative', height: rowVirtualizer.scrollHeight }}>
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

				{rowVirtualizer.virtualItems.map(virtualRow => {
					const row = rows[virtualRow.index];
					const isExpanded = row.getIsExpanded();
					return (
						<div
							key={row.id}
							ref={el => rowVirtualizer.measureElement(el, virtualRow.index)}
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
										style={{
											width: cell.column.getSize(),
											padding: '8px 12px',
											flexShrink: 0,
										}}
									>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</div>
								))}
							</div>
							{isExpanded && <ExpandedContent row={row} />}
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
