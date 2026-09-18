import { loremIpsum } from 'lorem-ipsum';
import { Virtualize } from './components/Virtualize';

const items = Array.from(
	{ length: 3000_000 },
	(_, i) =>
		`${i}. ${loremIpsum({
			format: 'plain',
			paragraphLowerBound: 3,
			paragraphUpperBound: 17,
			sentenceLowerBound: 5,
			sentenceUpperBound: 135,
		})}`
);

const App = () => <Virtualize count={items.length} height={500} renderItem={i => items[i]} />;

export default App;
