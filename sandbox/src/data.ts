// Mock data with variable-length text so rows have dynamic heights.

export const listBodies = [
	'Hello.',
	'This row is a bit longer and wraps onto a second line on narrow screens.',
	'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
	'Short one.',
	'Two lines probably. The virtualizer measures every row with ResizeObserver, so no fixed heights are needed anywhere.',
];

export type User = {
	id: number;
	name: string;
	role: string;
	bio: string;
};

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
const roles = ['Admin', 'Editor', 'Viewer', 'Manager', 'Developer'];
const bios = [
	'Senior engineer.',
	'Full-stack developer with 10 years of experience in distributed systems and cloud architecture, currently migrating the monolith to microservices.',
	'Frontend specialist focused on React and TypeScript.',
	'Tech lead overseeing a team of 8 developers across multiple projects and time zones.',
	'Junior developer eager to learn.',
];

export const makeUsers = (count: number): User[] =>
	Array.from({ length: count }, (_, i) => ({
		id: i + 1,
		name: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
		// email: `user${i + 1}@example.com`,
		role: roles[i % roles.length],
		bio: bios[i % bios.length],
	}));

export const expandedDetails = (id: number) =>
	`Details for user ${id}. Expanding a row changes its height and it gets re-measured automatically — no manual invalidation needed. `.repeat(
		1 + (id % 3)
	);
