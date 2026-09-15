import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScrollHeight } from '../hooks/useScrollHeight';
import { ESTIMATED_ROW_HEIGHT } from '../constants';

describe('useScrollHeight', () => {
	it('returns initial estimated height based on totalRowsNumber * ESTIMATED_ROW_HEIGHT', () => {
		const { result } = renderHook(() => useScrollHeight(100));
		expect(result.current[0]).toBe(100 * ESTIMATED_ROW_HEIGHT);
	});

	it('returns 0 when totalRowsNumber is 0', () => {
		const { result } = renderHook(() => useScrollHeight(0));
		expect(result.current[0]).toBe(0);
	});

	it('returns estimated height from ref before last row is committed', () => {
		const { result } = renderHook(() => useScrollHeight(100));

		act(() => {
			result.current[1]({ index: 5, offset: 300 });
		});

		expect(result.current[0]).toBe(100 * ESTIMATED_ROW_HEIGHT);
	});

	it('setHeight is a stable function reference', () => {
		const { result, rerender } = renderHook(() => useScrollHeight(10));
		const firstRef = result.current[1];
		rerender();
		expect(result.current[1]).toBe(firstRef);
	});

	it('commits height to state when index is last row using formula (offset * total) / index', () => {
		const { result } = renderHook(() => useScrollHeight(10));

		act(() => {
			result.current[1]({ index: 9, offset: 540 });
		});

		const expected = (540 * 10) / 9;
		expect(result.current[0]).toBe(expected);
	});

	it('setHeight does not throw on index 0', () => {
		const { result } = renderHook(() => useScrollHeight(10));
		expect(() => {
			act(() => {
				result.current[1]({ index: 0, offset: 0 });
			});
		}).not.toThrow();
	});

	it('updates estimated height in ref for mid-list calls', () => {
		const { result } = renderHook(() => useScrollHeight(20));

		act(() => {
			result.current[1]({ index: 10, offset: 600 });
		});

		const expected = Math.floor((600 * 20) / 10);
		expect(result.current[0]).toBe(expected);
	});

	it('last row setHeight overrides previous state', () => {
		const { result } = renderHook(() => useScrollHeight(10));

		act(() => {
			result.current[1]({ index: 9, offset: 300 });
		});
		expect(result.current[0]).toBe((300 * 10) / 9);

		act(() => {
			result.current[1]({ index: 9, offset: 600 });
		});
		expect(result.current[0]).toBe((600 * 10) / 9);
	});
});
