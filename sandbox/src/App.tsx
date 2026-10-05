import { useState } from 'react';
import { VirtualizedList } from './VirtualizedList';
import { VirtualTable } from './VirtualTable';
import { listBodies } from './data';

const LIST_MIN = 1000;
const LIST_MAX = 500_000;
const LIST_STEP = 1000;
const LIST_DEFAULT = 100_000;

const TABLE_MIN = 1000;
const TABLE_MAX = 100_000;
const TABLE_STEP = 1000;
const TABLE_DEFAULT = 20_000;

const formatCount = (value: number) => value.toLocaleString('en-US').replace(/,/g, ' ');

const pageStyle: React.CSSProperties = {
	maxWidth: 960,
	margin: '0 auto',
	padding: '32px 24px 64px',
	fontFamily: 'system-ui, -apple-system, sans-serif',
	color: '#222',
};

const sliderRowStyle: React.CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	gap: 16,
	margin: '12px 0 16px',
};

const codeStyle: React.CSSProperties = {
	display: 'block',
	background: '#f5f5f5',
	border: '1px solid #e3e3e3',
	borderRadius: 6,
	padding: '12px 16px',
	overflowX: 'auto',
};

const App = () => {
	const [listCount, setListCount] = useState(LIST_DEFAULT);
	const [tableCount, setTableCount] = useState(TABLE_DEFAULT);

	return (
		<div style={pageStyle}>
			<h1>clear-virtualizer sandbox</h1>
			<p>
				Live demo of the <code>useVirtualizer</code> hook: vertical virtualization with dynamic row heights.
				Rows are measured automatically via <code>ResizeObserver</code> — no manual measuring, no fixed
				heights. Only the visible window (plus overscan) is mounted in the DOM.
			</p>
			<code style={codeStyle}>npm i clear-virtualizer</code>
			<p>
				Use the sliders to change how many rows are virtualized. The list renders items on demand from the
				index, so it stays light even at {formatCount(LIST_MAX)} rows. The table builds real row objects (and
				runs them through TanStack Table), so its slider is capped at {formatCount(TABLE_MAX)} — generating
				more mock rows is what makes the browser crawl, not the virtualizer itself.
			</p>

			<h2>List example</h2>
			<p>
				Plain virtualized list from the README: rows are positioned with{' '}
				<code>transform: translateY(...)</code> and measured through <code>getMeasureRef</code>. Texts have
				different lengths, so every row gets its own height.
			</p>
			<label>
				Rows: <strong>{formatCount(listCount)}</strong>
				<div style={sliderRowStyle}>
					<input
						type="range"
						min={LIST_MIN}
						max={LIST_MAX}
						step={LIST_STEP}
						value={listCount}
						onChange={e => setListCount(Number(e.target.value))}
						style={{ flex: 1 }}
					/>
				</div>
			</label>
			<VirtualizedList
				count={listCount}
				height={550}
				overscan={10}
				estimateSize={() => 44}
				renderItem={index => (
					<div style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}>
						<strong>#{index + 1}</strong> {listBodies[index % listBodies.length]}
					</div>
				)}
			/>

			<h2 style={{ marginTop: 48 }}>Table example</h2>
			<p>
				Table with <code>@tanstack/react-table</code> and expandable rows. Column widths are set on header and
				body cells so columns stay aligned, the header is <code>position: sticky</code>. Click ▶ on any row —
				expanding changes its height and it gets re-measured automatically.
			</p>
			<label>
				Rows: <strong>{formatCount(tableCount)}</strong>
				<div style={sliderRowStyle}>
					<input
						type="range"
						min={TABLE_MIN}
						max={TABLE_MAX}
						step={TABLE_STEP}
						value={tableCount}
						onChange={e => setTableCount(Number(e.target.value))}
						style={{ flex: 1 }}
					/>
				</div>
			</label>
			<VirtualTable count={tableCount} />
		</div>
	);
};

export default App;
