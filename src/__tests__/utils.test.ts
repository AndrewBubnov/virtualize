import { describe, it, expect } from 'vitest';
import { getInitCache, findOffset, CacheItem } from '../utils';
import { ESTIMATED_ROW_HEIGHT } from '../constants';

describe('getInitCache', () => {
	it('returns an array of given length', () => {
		const cache = getInitCache(10);
		expect(cache).toHaveLength(10);
	});

	it('returns empty array for length 0', () => {
		const cache = getInitCache(0);
		expect(cache).toHaveLength(0);
	});

	it('first item has offset 0', () => {
		const cache = getInitCache(5);
		expect(cache[0]).toEqual({ offset: 0, height: ESTIMATED_ROW_HEIGHT });
	});

	it('each subsequent item offset increments by ESTIMATED_ROW_HEIGHT', () => {
		const cache = getInitCache(5);
		for (let i = 1; i < cache.length; i++) {
			expect(cache[i].offset).toBe(cache[i - 1].offset + ESTIMATED_ROW_HEIGHT);
		}
	});

	it('all items have height equal to ESTIMATED_ROW_HEIGHT', () => {
		const cache = getInitCache(100);
		cache.forEach(item => {
			expect(item.height).toBe(ESTIMATED_ROW_HEIGHT);
		});
	});

	it('last item offset is (length - 1) * ESTIMATED_ROW_HEIGHT', () => {
		const cache = getInitCache(50);
		expect(cache[49].offset).toBe(49 * ESTIMATED_ROW_HEIGHT);
	});
});

describe('findOffset', () => {
	it('returns 0 when scroll is 0 (finds last index where offset <= scroll)', () => {
		const cache = getInitCache(10);
		expect(findOffset(cache, 0)).toBe(0);
	});

	it('returns correct index for exact offset match', () => {
		const cache = getInitCache(10);
		expect(findOffset(cache, ESTIMATED_ROW_HEIGHT)).toBe(1);
		expect(findOffset(cache, ESTIMATED_ROW_HEIGHT * 3)).toBe(3);
	});

	it('returns correct index for scroll between offsets', () => {
		const cache = getInitCache(10);
		expect(findOffset(cache, ESTIMATED_ROW_HEIGHT * 0.5)).toBe(0);
		expect(findOffset(cache, ESTIMATED_ROW_HEIGHT * 2.9)).toBe(2);
	});

	it('returns length - 1 for scroll beyond last item', () => {
		const cache = getInitCache(5);
		const maxOffset = (5 - 1) * ESTIMATED_ROW_HEIGHT;
		expect(findOffset(cache, maxOffset + 100)).toBe(4);
	});

	it('works with custom cache items', () => {
		const cache: CacheItem[] = [
			{ offset: 0, height: 30 },
			{ offset: 30, height: 40 },
			{ offset: 70, height: 50 },
		];
		expect(findOffset(cache, 0)).toBe(0);
		expect(findOffset(cache, 30)).toBe(1);
		expect(findOffset(cache, 69)).toBe(1);
		expect(findOffset(cache, 70)).toBe(2);
		expect(findOffset(cache, 120)).toBe(2);
	});

	it('works with single element cache', () => {
		const cache: CacheItem[] = [{ offset: 0, height: 60 }];
		expect(findOffset(cache, 0)).toBe(0);
		expect(findOffset(cache, 1)).toBe(0);
	});

	it('returns last index when scroll equals last offset', () => {
		const cache = getInitCache(3);
		const lastOffset = 2 * ESTIMATED_ROW_HEIGHT;
		expect(findOffset(cache, lastOffset)).toBe(2);
	});

	it('returns -1 for empty cache', () => {
		expect(findOffset([], 0)).toBe(-1);
	});
});
