import styles from './App.module.css';
import { Virtualized } from './components/Vitrualized/Virtualized.tsx';
import { loremIpsum } from 'lorem-ipsum';

const items = Array.from(
	{ length: 1000_000 },
	(_, i) =>
		`${i + 1}. ${loremIpsum({
			format: 'plain',
			paragraphLowerBound: 3,
			paragraphUpperBound: 7,
			sentenceLowerBound: 5,
			sentenceUpperBound: 35,
		})}`
);

function App() {
	return (
		<div className={styles.container}>
			<Virtualized items={items} />
		</div>
	);
}

export default App;
