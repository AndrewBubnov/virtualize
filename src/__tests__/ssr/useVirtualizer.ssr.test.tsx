/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { useVirtualizer } from '../../hooks/useVirtualizer';

function Probe({ count }: { count: number }) {
	const { virtualItems, scrollHeight, scrollRef, getMeasureRef, scrollToIndex } = useVirtualizer({
		count,
		estimateSize: () => 40,
	});
	return (
		<div
			ref={scrollRef}
			data-scroll-height={scrollHeight}
			data-item-count={virtualItems.length}
			data-has-measure-ref={typeof getMeasureRef}
			data-has-scroll-to-index={typeof scrollToIndex}
		/>
	);
}

describe('useVirtualizer SSR', () => {
	it('renders on the server without browser globals', () => {
		expect(typeof ResizeObserver).toBe('undefined');

		let html: string | undefined;
		expect(() => {
			html = renderToString(<Probe count={100000} />);
		}).not.toThrow();

		expect(html).toContain('data-scroll-height="0"');
		expect(html).toContain('data-item-count="0"');
	});

	it('is deterministic across server renders (hydration-safe initial HTML)', () => {
		const first = renderToString(<Probe count={100000} />);
		const second = renderToString(<Probe count={100000} />);
		expect(first).toBe(second);
	});

	it('renders empty output for count 0', () => {
		const html = renderToString(<Probe count={0} />);
		expect(html).toContain('data-scroll-height="0"');
		expect(html).toContain('data-item-count="0"');
	});
});
