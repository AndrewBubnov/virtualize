import { Virtualized } from 'components/Vitrualized/Virtualized.tsx';
import { loremIpsum } from 'lorem-ipsum';
import { Expandable } from './components/Presentation/Expandable.tsx';
import styles from './App.module.css';

const items = Array.from(
	{ length: 10_000 },
	(_, i) =>
		`${i}. ${loremIpsum({
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
			<Virtualized
				items={items.map(el => (
					<Expandable>{el}</Expandable>
				))}
			/>
		</div>
	);
}

export default App;
