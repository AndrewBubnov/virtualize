import styles from './App.module.css';
import { Virtualized } from './components/Vitrualized/Virtualized.tsx';
import { loremIpsum } from 'lorem-ipsum';
import { useState } from 'react';

const Expandable = ({ children }: { children: string }) => {
	const [isExpanded, setIsExpanded] = useState(false);
	return (
		<div style={{ cursor: 'pointer' }} onClick={() => setIsExpanded(prevState => !prevState)}>
			{isExpanded ? `${children} ${children} ${children}` : children}
		</div>
	);
};

const items = Array.from(
	{ length: 100_000 },
	(_, i) =>
		`${i}. ${loremIpsum({
			format: 'plain',
			paragraphLowerBound: 3,
			paragraphUpperBound: 7,
			sentenceLowerBound: 5,
			sentenceUpperBound: 35,
		})}`
);

const expandableItems = items.map(el => <Expandable>{el}</Expandable>);

function App() {
	return (
		<div className={styles.container}>
			<Virtualized items={expandableItems} />
		</div>
	);
}

export default App;
