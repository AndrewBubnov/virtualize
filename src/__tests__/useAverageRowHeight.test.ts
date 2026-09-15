import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAverageRowHeight } from '../hooks/useAverageRowHeight';
import { ESTIMATED_ROW_HEIGHT } from '../constants';

describe('useAverageRowHeight', () => {
	it('returns ESTIMATED_ROW_HEIGHT as initial rowHeight', () => {
		const { result } = renderHook(() => useAverageRowHeight());
		expect(result.current.rowHeight).toBe(ESTIMATED_ROW_HEIGHT);
	});

	it('setRowHeight is a stable function reference', () => {
		const { result, rerender } = renderHook(() => useAverageRowHeight());
		const firstRef = result.current.setRowHeight;
		rerender();
		expect(result.current.setRowHeight).toBe(firstRef);
	});

	it('setRowHeight does not throw on valid input', () => {
		const { result } = renderHook(() => useAverageRowHeight());
		expect(() => {
			act(() => {
				result.current.setRowHeight({ index: 0, height: 100 });
			});
		}).not.toThrow();
	});

	it('setRowHeight does not throw on duplicate index', () => {
		const { result } = renderHook(() => useAverageRowHeight());
		expect(() => {
			act(() => {
				result.current.setRowHeight({ index: 0, height: 100 });
			});
			act(() => {
				result.current.setRowHeight({ index: 0, height: 200 });
			});
		}).not.toThrow();
	});

	it('setRowHeight does not throw on out-of-order index calls', () => {
		const { result } = renderHook(() => useAverageRowHeight());
		expect(() => {
			act(() => {
				result.current.setRowHeight({ index: 5, height: 50 });
			});
			act(() => {
				result.current.setRowHeight({ index: 2, height: 150 });
			});
		}).not.toThrow();
	});

	it('setRowHeight does not throw on zero height', () => {
		const { result } = renderHook(() => useAverageRowHeight());
		expect(() => {
			act(() => {
				result.current.setRowHeight({ index: 0, height: 0 });
			});
		}).not.toThrow();
	});
});
