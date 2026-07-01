import { Virtualized } from './components/Virtualized';
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

const App = () => (
	<div style={{ width: 500 }}>
		<Virtualized height={550}>
			{items.map((el, index) => (
				<div key={index} style={{ padding: 12 }}>
					{el}
				</div>
			))}
		</Virtualized>
	</div>
);

export default App;
