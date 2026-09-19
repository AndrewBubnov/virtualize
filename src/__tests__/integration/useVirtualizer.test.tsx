import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVirtualizer } from '../../hooks/useVirtualizer';

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

	it('exposes getMeasureRef in return value', () => {
		const { result } = setup(10);
		expect(typeof result.current.getMeasureRef).toBe('function');
	});

	it('getMeasureRef updates scrollHeight after ResizeObserver callback', () => {
		vi.useFakeTimers();

		vi.stubGlobal(
			'ResizeObserver',
			class {
				constructor(cb: ResizeObserverCallback) {
					cb([{ borderBoxSize: [{ blockSize: 80 }] } as unknown as ResizeObserverEntry], this as unknown as ResizeObserver);
				}
				observe = vi.fn();
				disconnect = vi.fn();
				unobserve = vi.fn();
			}
		);

		const { result } = setup(5, { estimateSize: () => 40 });

		expect(result.current.scrollHeight).toBe(200);

		const el = document.createElement('div');
		Object.defineProperty(el, 'clientHeight', { value: 80, configurable: true });

		act(() => {
			result.current.getMeasureRef(0)(el);
		});

		act(() => {
			vi.advanceTimersByTime(1);
		});

		expect(result.current.scrollHeight).toBe(80 + 4 * 40);

		vi.unstubAllGlobals();
		vi.useRealTimers();
	});

	it('getMeasureRef with ResizeObserver updates height', () => {
		vi.useFakeTimers();

		let resizeCallback: ResizeObserverCallback | undefined;
		const mockObserve = vi.fn();
		const mockDisconnect = vi.fn();

		vi.stubGlobal(
			'ResizeObserver',
			class {
				constructor(cb: ResizeObserverCallback) {
					resizeCallback = cb;
				}
				observe = mockObserve;
				disconnect = mockDisconnect;
				unobserve = vi.fn();
			}
		);

		const { result } = setup(5, { estimateSize: () => 40 });
		const el = document.createElement('div');
		Object.defineProperty(el, 'clientHeight', { value: 40, configurable: true });

		act(() => {
			result.current.getMeasureRef(2)(el);
		});

		expect(mockObserve).toHaveBeenCalledWith(el);

		const prevHeight = result.current.scrollHeight;

		act(() => {
			resizeCallback!(
				[{ borderBoxSize: [{ blockSize: 100 }] } as unknown as ResizeObserverEntry],
				{} as ResizeObserver
			);
		});

		act(() => {
			vi.advanceTimersByTime(1);
		});

		expect(result.current.scrollHeight).toBe(prevHeight - 40 + 100);

		vi.unstubAllGlobals();
		vi.useRealTimers();
	});

	it('getMeasureRef disconnects observer on null', () => {
		const disconnect = vi.fn();
		const observers: ResizeObserver[] = [];

		vi.stubGlobal(
			'ResizeObserver',
			class {
				constructor() {
					observers.push(this as unknown as ResizeObserver);
				}
				observe = vi.fn();
				disconnect = disconnect;
				unobserve = vi.fn();
			}
		);

		const { result } = setup(5, { estimateSize: () => 40 });
		const el = document.createElement('div');
		Object.defineProperty(el, 'clientHeight', { value: 40, configurable: true });

		act(() => {
			result.current.getMeasureRef(0)(el);
		});

		expect(observers.length).toBe(1);

		act(() => {
			result.current.getMeasureRef(0)(null);
		});

		expect(disconnect).toHaveBeenCalled();

		vi.unstubAllGlobals();
	});

	it('scrollToIndex settles with target in viewport after re-measurement', async () => {
		const callbacks: ResizeObserverCallback[] = [];
		vi.stubGlobal(
			'ResizeObserver',
			class {
				constructor(cb: ResizeObserverCallback) {
					callbacks.push(cb);
				}
				observe = vi.fn();
				disconnect = vi.fn();
				unobserve = vi.fn();
			}
		);

		const { result, el } = setup(1000, { clientHeight: 200 });

		act(() => {
			result.current.scrollToIndex(500, { align: 'start' });
		});
		expect(el.scrollTop).toBe(500 * ROW_HEIGHT);

		// Report 120px real heights vs the 40px estimate.
		act(() => {
			for (let i = 497; i <= 503; i++) {
				result.current.getMeasureRef(i)(document.createElement('div'));
			}
		});
		act(() => {
			for (const cb of callbacks) {
				cb([{ borderBoxSize: [{ blockSize: 120 }] } as unknown as ResizeObserverEntry], {} as ResizeObserver);
			}
		});

		await act(async () => {
			await new Promise(res => setTimeout(res, 300)); // Let the rAF settle chain flush.
		});

		// prefixSum(500) = 497*40 + 3*120 = 20240
		expect(el.scrollTop).toBe(20240);
		const indexes = result.current.virtualItems.map(v => v.index);
		expect(indexes).toContain(500);
		expect(result.current.virtualItems.find(v => v.index === 500)?.start).toBe(el.scrollTop);

		vi.unstubAllGlobals();
	});

	it('user scroll during settle cancels scrollToIndex', async () => {
		const { result, el } = setup(COUNT, { clientHeight: 200 });

		act(() => {
			result.current.scrollToIndex(50, { align: 'start' });
		});
		expect(el.scrollTop).toBe(50 * ROW_HEIGHT);

		act(() => {
			el.dispatchEvent(new Event('scroll'));
		});
		el.scrollTop = 0;
		act(() => {
			el.dispatchEvent(new Event('scroll'));
		});

		await act(async () => {
			await new Promise(res => setTimeout(res, 300)); // Let the rAF settle chain flush.
		});

		expect(el.scrollTop).toBe(0);
		expect(result.current.virtualItems[0].index).toBe(0);
		expect(result.current.virtualItems.map(v => v.index)).not.toContain(50);
	});
});
