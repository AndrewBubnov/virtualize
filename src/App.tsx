import { useMemo } from 'react';
import { loremIpsum } from 'lorem-ipsum';
import { Virtualize } from './components/Virtualize';

function App() {
	const items = useMemo(
		() =>
			Array.from(
				{ length: 4_00_000 },
				(_, i) =>
					`${i}. ${loremIpsum({
						format: 'plain',
						paragraphLowerBound: 3,
						paragraphUpperBound: 17,
						sentenceLowerBound: 5,
						sentenceUpperBound: 135,
					})}`
			),
		[]
	);

	return <Virtualize count={items.length} height={500} overscan={10} renderItem={i => items[i]} />;
}

export default App;
