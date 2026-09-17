import { loremIpsum } from 'lorem-ipsum';
import { Virtualize } from './components/Virtualize';

const items = Array.from(
	{ length: 1_000_000 },
	(_, i) =>
		`${i}. ${loremIpsum({
			format: 'plain',
			paragraphLowerBound: 3,
			paragraphUpperBound: 17,
			sentenceLowerBound: 5,
			sentenceUpperBound: 135,
		})}`
);

const App = () => <Virtualize count={items.length} height={500} overscan={10} renderItem={i => items[i]} />;

export default App;
