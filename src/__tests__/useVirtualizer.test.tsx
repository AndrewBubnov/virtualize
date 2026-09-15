import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVirtualizer } from '../hooks/useVirtualizer';

function createScrollElement(clientHeight: number = 600) {
	const el = document.createElement('div');
	Object.defineProperty(el, 'clientHeight', { value: clientHeight, configurable: true });
	Object.defineProperty(el, 'scrollTop', { value: 0, writable: true, configurable: true });
	return el;
}

function setup(
	count: number,
	options: { clientHeight?: number; estimateSize?: (i: number) => number; overscan?: number } = {}
) {
	const { clientHeight = 600, estimateSize = () => 40, overscan = 3 } = options;
	const el = createScrollElement(clientHeight);

	const { result } = renderHook(() => useVirtualizer({ count, estimateSize, overscan }));

	act(() => {
		result.current.scrollRef(el);
	});

	return { result, el };
}

beforeEach(() => {
	(globalThis as unknown as { requestAnimationFrame: typeof requestAnimationFrame }).requestAnimationFrame = (
		cb: FrameRequestCallback
	) => setTimeout(cb, 0);
	(globalThis as unknown as { cancelAnimationFrame: typeof cancelAnimationFrame }).cancelAnimationFrame = (
		id: number
	) => clearTimeout(id);
});

describe('useVirtualizer', () => {
	const COUNT = 100;
	const ROW_HEIGHT = 40;

	it('returns correct totalSize', () => {
		const { result } = setup(COUNT);
		expect(result.current.scrollHeight).toBe(COUNT * ROW_HEIGHT);
	});

	it('returns visible items for initial scroll position', () => {
		const { result } = setup(COUNT, { clientHeight: 200, overscan: 0 });

		const items = result.current.virtualItems;
		expect(items.length).toBeGreaterThan(0);
		expect(items[0].index).toBe(0);
		expect(items[0].start).toBe(0);
		expect(items[items.length - 1].end).toBeGreaterThanOrEqual(200);
	});

	it('applies overscan correctly', () => {
		const { result: withOverscan } = setup(COUNT, { clientHeight: 200, overscan: 5 });
		const { result: withoutOverscan } = setup(COUNT, { clientHeight: 200, overscan: 0 });

		expect(withOverscan.current.virtualItems.length).toBeGreaterThanOrEqual(
			withoutOverscan.current.virtualItems.length
		);
	});

	it('scrollToIndex sets scrollTop correctly', () => {
		const { result, el } = setup(COUNT);

		act(() => {
			result.current.scrollToIndex(10);
		});
		expect(el.scrollTop).toBe(10 * ROW_HEIGHT);
	});

	it('scrollToIndex with align center', () => {
		const { result, el } = setup(COUNT, { clientHeight: 200 });

		act(() => {
			result.current.scrollToIndex(10, { align: 'center' });
		});
		const expected = 10 * ROW_HEIGHT - (200 - ROW_HEIGHT) / 2;
		expect(el.scrollTop).toBe(Math.max(0, expected));
	});

	it('scrollToIndex with align end', () => {
		const { result, el } = setup(COUNT, { clientHeight: 200 });

		act(() => {
			result.current.scrollToIndex(10, { align: 'end' });
		});
		const expected = 10 * ROW_HEIGHT - (200 - ROW_HEIGHT);
		expect(el.scrollTop).toBe(Math.max(0, expected));
	});

	it('scrollToIndex clamps to 0 for negative values', () => {
		const { result, el } = setup(COUNT);

		act(() => {
			result.current.scrollToIndex(-5);
		});
		expect(el.scrollTop).toBe(0);
	});

	it('scrollToIndex does nothing for out of bounds index', () => {
		const { result, el } = setup(COUNT);

		el.scrollTop = 100;
		act(() => {
			result.current.scrollToIndex(999);
		});
		expect(el.scrollTop).toBe(100);
	});

	it('supports dynamic estimateSize', () => {
		const sizes = [20, 40, 60, 80, 100];
		const { result } = setup(10, {
			estimateSize: i => sizes[i % sizes.length],
		});
		expect(result.current.scrollHeight).toBe(20 + 40 + 60 + 80 + 100 + 20 + 40 + 60 + 80 + 100);
	});

	it('returns 0 totalSize for count 0', () => {
		const { result } = setup(0);
		expect(result.current.scrollHeight).toBe(0);
	});

	it('returns empty items for count 0', () => {
		const { result } = setup(0, { clientHeight: 200 });
		expect(result.current.virtualItems).toEqual([]);
	});
});
