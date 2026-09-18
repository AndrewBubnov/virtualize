import { loremIpsum } from 'lorem-ipsum';
import { VirtualizedList } from './components/VirtualizedList.tsx';

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

const App = () => (
	<VirtualizedList count={items.length} height={500} renderItem={i => items[i]}>
		{onClick => <button onClick={() => onClick(34567)}>To index</button>}
	</VirtualizedList>
);

export default App;
