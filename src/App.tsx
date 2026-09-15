import { Virtualized } from './components/Virtualized';
import { VirtualizedTable, Column } from './components/VirtualizedTable';
import { loremIpsum } from 'lorem-ipsum';

const items = Array.from(
	{ length: 400_000 },
	(_, i) =>
		`${i}. ${loremIpsum({
			format: 'plain',
			paragraphLowerBound: 3,
			paragraphUpperBound: 7,
			sentenceLowerBound: 5,
			sentenceUpperBound: 35,
		})}`
);

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

const columns: Column<User>[] = [
	{ key: 'id', header: 'ID', width: 70, align: 'right' },
	{ key: 'name', header: 'Name', width: 180 },
	{ key: 'email', header: 'Email', width: 220 },
	{ key: 'role', header: 'Role', width: 120 },
	{
		key: 'status',
		header: 'Status',
		width: 100,
		align: 'center',
		render: row => (
			<span style={{ color: row.status === 'active' ? 'green' : 'red', fontWeight: 600 }}>{row.status}</span>
		),
	},
];

const App = () => (
	<div style={{ display: 'flex', flexDirection: 'column', gap: 32, padding: 24 }}>
		<div>
			<h2>Virtual List</h2>
			<div style={{ width: 500 }}>
				<Virtualized height={550}>
					{items.map((el, index) => (
						<div key={index} style={{ padding: 12 }}>
							{el}
						</div>
					))}
				</Virtualized>
			</div>
		</div>

		<div>
			<h2>Virtual Table — 100k rows</h2>
			<VirtualizedTable columns={columns} rows={tableData} height={550} rowKey={row => row.id} />
		</div>
	</div>
);

export default App;
