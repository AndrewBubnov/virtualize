import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVirtualizer } from '../hooks/useVirtualizer';

function createScrollElement(clientHeight: number = 600) {
	const el = document.createElement('div');
	let _scrollTop = 0;
	Object.defineProperty(el, 'clientHeight', { value: clientHeight, configurable: true });
	Object.defineProperty(el, 'scrollTop', {
		get() { return _scrollTop; },
		set(v) { _scrollTop = v; },
		configurable: true,
	});
	return el;
}

function setup(
	count: number,
	options: { clientHeight?: number; estimateSize?: (i: number) => number; overscan?: number } = {}
) {
	const { clientHeight = 200, estimateSize = () => 40, overscan = 0 } = options;
	const el = createScrollElement(clientHeight);

	const { result } = renderHook(() => useVirtualizer({ count, estimateSize, overscan }));

	act(() => {
		result.current.scrollRef(el);
	});

	return { result, el };
}

beforeEach(() => {
	vi.useFakeTimers();
	globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(cb, 0);
	globalThis.cancelAnimationFrame = (id: number) => clearTimeout(id);
});

afterEach(() => {
	vi.useRealTimers();
});

describe('useVirtualizer for list virtualization', () => {
	it('renders only visible rows', () => {
		const { result } = setup(100, { clientHeight: 200, overscan: 0 });

		const items = result.current.virtualItems;
		expect(items.length).toBeGreaterThan(0);
		expect(items[0].index).toBe(0);
		expect(items[items.length - 1].index).toBeLessThan(100);
	});

	it('renders correct number of rows (container / rowHeight)', () => {
		const { result } = setup(100, { clientHeight: 200, estimateSize: () => 40, overscan: 0 });

		expect(result.current.virtualItems.length).toBe(5);
	});

	it('applies overscan', () => {
		const { result: withOverscan } = setup(100, { clientHeight: 200, overscan: 5 });
		const { result: withoutOverscan } = setup(100, { clientHeight: 200, overscan: 0 });

		expect(withOverscan.current.virtualItems.length).toBeGreaterThan(
			withoutOverscan.current.virtualItems.length
		);
	});

	it('renders fewer rows for small list than container', () => {
		const { result } = setup(3, { clientHeight: 200, overscan: 0 });

		expect(result.current.virtualItems.length).toBe(3);
		expect(result.current.virtualItems.map(i => i.index)).toEqual([0, 1, 2]);
	});

	it('returns empty items for count 0', () => {
		const { result } = setup(0, { clientHeight: 200 });
		expect(result.current.virtualItems).toEqual([]);
	});

	it('rows have correct start positions', () => {
		const { result } = setup(100, { clientHeight: 200, estimateSize: () => 40, overscan: 0 });

		expect(result.current.virtualItems[0].start).toBe(0);
		expect(result.current.virtualItems[1].start).toBe(40);
		expect(result.current.virtualItems[2].start).toBe(80);
	});

	it('scrollHeight equals count * rowHeight', () => {
		const { result } = setup(100, { estimateSize: () => 40 });
		expect(result.current.scrollHeight).toBe(4000);
	});

	it('scrollToIndex scrolls to correct position', () => {
		const { result, el } = setup(100);

		act(() => {
			result.current.scrollToIndex(10);
		});
		expect(el.scrollTop).toBe(400);
	});

	it('virtualItems update after scroll', () => {
		const { result, el } = setup(100, { clientHeight: 200, estimateSize: () => 40, overscan: 0 });

		expect(result.current.virtualItems[0].index).toBe(0);

		act(() => {
			el.scrollTop = 200;
			el.dispatchEvent(new Event('scroll'));
		});
		act(() => {
			vi.advanceTimersByTime(1);
		});

		expect(result.current.virtualItems[0].index).toBe(5);
	});
});
