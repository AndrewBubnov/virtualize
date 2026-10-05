import { useEffect, useState } from 'react';
import { VirtualizedList } from './VirtualizedList';
import { VirtualTable } from './VirtualTable';
import { listBodies } from './data';
import './styles.css';

const LIST_MIN = 1000;
const LIST_MAX = 500_000;
const LIST_MAX_MOBILE = 100_000;
const LIST_STEP = 1000;
const LIST_DEFAULT = 100_000;

const TABLE_MIN = 1000;
const TABLE_MAX = 100_000;
const TABLE_MAX_MOBILE = 20_000;
const TABLE_STEP = 1000;
const TABLE_DEFAULT = 20_000;

const MOBILE_QUERY = '(max-width: 900px)';

const formatCount = (value: number) => value.toLocaleString('en-US').replace(/,/g, ' ');

const useIsMobile = () => {
	const [isMobile, setIsMobile] = useState(
		() => typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches
	);
	useEffect(() => {
		const query = window.matchMedia(MOBILE_QUERY);
		const onChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);
		query.addEventListener('change', onChange);
		return () => query.removeEventListener('change', onChange);
	}, []);
	return isMobile;
};

type CountSliderProps = {
	min: number;
	max: number;
	step: number;
	value: number;
	onCommit: (value: number) => void;
};

const CountSlider = ({ min, max, step, value, onCommit }: CountSliderProps) => {
	const [draft, setDraft] = useState(value);
	useEffect(() => {
		setDraft(Math.min(value, max));
	}, [value, max]);
	const commit = () => {
		const next = Math.min(draft, max);
		if (next !== value) onCommit(next);
		else setDraft(next);
	};
	return (
		<div className="slider-row">
			<input
				type="range"
				min={min}
				max={max}
				step={step}
				value={Math.min(draft, max)}
				onChange={e => setDraft(Number(e.target.value))}
				onPointerUp={commit}
				onKeyUp={commit}
				onBlur={commit}
			/>
			<strong>{formatCount(Math.min(draft, max))}</strong>
		</div>
	);
};

const App = () => {
	const isMobile = useIsMobile();
	const listMax = isMobile ? LIST_MAX_MOBILE : LIST_MAX;
	const tableMax = isMobile ? TABLE_MAX_MOBILE : TABLE_MAX;
	const [listCount, setListCount] = useState(LIST_DEFAULT);
	const [tableCount, setTableCount] = useState(TABLE_DEFAULT);
	const effectiveListCount = Math.min(listCount, listMax);
	const effectiveTableCount = Math.min(tableCount, tableMax);

	return (
		<div className="sandbox-page">
			<h1>clear-virtualizer sandbox</h1>
			<p>
				Live demo of the <code>useVirtualizer</code> hook: vertical virtualization with dynamic row heights.
				Rows are measured automatically via <code>ResizeObserver</code> — no manual measuring, no fixed
				heights. Only the visible window (plus overscan) is mounted in the DOM.
			</p>
			<code className="sandbox-code">npm i clear-virtualizer</code>
			<p>
				Use the sliders to change how many rows are virtualized (applied on release). The list renders items
				on demand from the index, so it stays light even at {formatCount(LIST_MAX)} rows. The table builds
				real row objects (and runs them through TanStack Table), so its slider is capped at{' '}
				{formatCount(TABLE_MAX)} — generating more mock rows is what makes the browser crawl, not the
				virtualizer itself.
				{isMobile && (
					<>
						{' '}
						On small screens the caps are lower ({formatCount(LIST_MAX_MOBILE)} /{' '}
						{formatCount(TABLE_MAX_MOBILE)}) to stay within mobile memory limits.
					</>
				)}
			</p>

			<div className="demo-layout">
				<section className="demo-panel">
					<h2>List example</h2>
					<p className="demo-desc">
						Plain virtualized list from the README: rows are positioned with{' '}
						<code>transform: translateY(...)</code> and measured through <code>getMeasureRef</code>.
						Texts have different lengths, so every row gets its own height.
					</p>
					<label>
						Rows: <strong>{formatCount(effectiveListCount)}</strong>
						<CountSlider
							min={LIST_MIN}
							max={listMax}
							step={LIST_STEP}
							value={effectiveListCount}
							onCommit={setListCount}
						/>
					</label>
					<VirtualizedList
						count={effectiveListCount}
						height={400}
						overscan={10}
						estimateSize={() => 44}
						renderItem={index => (
							<div className="vlist-row">
								<strong>#{index + 1}</strong> {listBodies[index % listBodies.length]}
							</div>
						)}
					/>
				</section>

				<section className="demo-panel">
					<h2>Table example</h2>
					<p className="demo-desc">
						Table with <code>@tanstack/react-table</code> and expandable rows. Column widths are set on
						header and body cells so columns stay aligned, the header is <code>position: sticky</code>.
						Click ▶ on any row — expanding changes its height and it gets re-measured automatically.
					</p>
					<label>
						Rows: <strong>{formatCount(effectiveTableCount)}</strong>
						<CountSlider
							min={TABLE_MIN}
							max={tableMax}
							step={TABLE_STEP}
							value={effectiveTableCount}
							onCommit={setTableCount}
						/>
					</label>
					<VirtualTable count={effectiveTableCount} />
				</section>
			</div>
		</div>
	);
};

export default App;
