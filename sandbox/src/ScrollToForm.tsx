import { useState } from 'react';
import type { ScrollAlign } from '../../src';

type ScrollToFormProps = {
	count: number;
	onJump: (index: number, align: ScrollAlign) => void;
};

export const ScrollToForm = ({ count, onJump }: ScrollToFormProps) => {
	const [raw, setRaw] = useState('');
	const [align, setAlign] = useState<ScrollAlign>('start');

	const submit = (event: React.FormEvent) => {
		event.preventDefault();
		const parsed = Number.parseInt(raw, 10);
		if (Number.isNaN(parsed)) return;
		// Human-friendly 1-based row number → 0-based index, clamped into range.
		const index = Math.min(Math.max(parsed - 1, 0), Math.max(count - 1, 0));
		onJump(index, align);
	};

	return (
		<form className="goto-form" onSubmit={submit}>
			<label>
				Go to row
				<input
					type="number"
					min={1}
					max={count}
					step={1}
					value={raw}
					placeholder={`1 – ${count.toLocaleString('en-US').replace(/,/g, ' ')}`}
					onChange={e => setRaw(e.target.value)}
				/>
			</label>
			<label>
				Align
				<select value={align} onChange={e => setAlign(e.target.value as ScrollAlign)}>
					<option value="start">start</option>
					<option value="center">center</option>
					<option value="end">end</option>
				</select>
			</label>
			<button type="submit">Scroll</button>
		</form>
	);
};
