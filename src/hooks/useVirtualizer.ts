import { useCallback, useReducer, useRef } from 'react';
import { useLatest } from './useLatest.ts';

export type VirtualItem = {
	index: number;
	start: number;
	size: number;
	end: number;
};

export type VirtualizerOptions = {
	count: number;
	estimateSize: (index: number) => number;
	overscan?: number;
};

export type Virtualizer = {
	virtualItems: VirtualItem[];
	scrollHeight: number;
	scrollToIndex: (index: number, options?: { align?: 'start' | 'center' | 'end' }) => void;
	scrollRef: (element: HTMLElement | null) => void;
	measureElement: (element: HTMLElement | null, index: number) => void;
};

const DEFAULT_OVERSCAN = 3;

export function useVirtualizer({ count, estimateSize, overscan = DEFAULT_OVERSCAN }: VirtualizerOptions): Virtualizer {
	const [, forceRender] = useReducer(x => x + 1, 0);
	const scrollElementRef = useRef<HTMLElement | null>(null);
	const rafRef = useRef<number | null>(null);
	const scrollOffsetRef = useRef(0);
	const observersRef = useRef<Map<number, ResizeObserver>>(new Map());
	const measuredCacheRef = useRef<Map<number, number>>(new Map());
	const estimateSizeRef = useLatest(estimateSize);

	const getEffectiveSize = useCallback(
		(index: number) => measuredCacheRef.current.get(index) ?? estimateSizeRef.current(index),
		[estimateSizeRef]
	);

	const computeItems = useCallback(
		(scrollOffset: number) => {
			const el = scrollElementRef.current;
			if (!el || count === 0) return { items: [], total: 0 };

			const containerHeight = el.clientHeight;

			const offsets: number[] = new Array(count);
			let total = 0;
			for (let i = 0; i < count; i++) {
				offsets[i] = total;
				total += getEffectiveSize(i);
			}

			let startIndex = 0;
			while (startIndex < count && offsets[startIndex] < scrollOffset) {
				startIndex++;
			}

			startIndex = Math.max(startIndex - overscan, 0);

			let endIndex = startIndex;
			while (endIndex < count && offsets[endIndex] - offsets[startIndex] < containerHeight) {
				endIndex++;
			}
			endIndex = Math.min(endIndex + overscan, count);

			const items: VirtualItem[] = [];
			for (let i = startIndex; i < endIndex; i++) {
				const size = getEffectiveSize(i);
				const start = offsets[i];
				items.push({ index: i, start, size, end: start + size });
			}

			return { items, total };
		},
		[count, overscan, getEffectiveSize]
	);

	const handleScroll = useCallback(() => {
		if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

		rafRef.current = requestAnimationFrame(() => {
			const el = scrollElementRef.current;
			if (el) {
				scrollOffsetRef.current = el.scrollTop;
				forceRender();
			}
		});
	}, []);

	const scrollRef = useCallback(
		(element: HTMLElement | null) => {
			if (scrollElementRef.current) scrollElementRef.current.removeEventListener('scroll', handleScroll);

			scrollElementRef.current = element;

			if (element) {
				element.addEventListener('scroll', handleScroll, { passive: true });
				scrollOffsetRef.current = element.scrollTop;
			}
			forceRender();
		},
		[handleScroll]
	);

	const measureElement = useCallback((element: HTMLElement | null, index: number) => {
		if (!element) {
			observersRef.current.get(index)?.disconnect();
			observersRef.current.delete(index);
			return;
		}

		const observer = new ResizeObserver(([entry]) => {
			const height = entry?.borderBoxSize[0]?.blockSize;
			if (height == null) return;

			const prev = measuredCacheRef.current.get(index);
			if (prev === height) return;

			measuredCacheRef.current.set(index, height);
			forceRender();
		});

		observer.observe(element);
		observersRef.current.set(index, observer);
	}, []);

	const { items, total } = computeItems(scrollOffsetRef.current);

	const scrollToIndex = useCallback(
		(index: number, options?: { align?: 'start' | 'center' | 'end' }) => {
			const el = scrollElementRef.current;
			if (!el || index < 0 || index >= count) return;

			const align = options?.align ?? 'start';
			let offset = 0;
			for (let i = 0; i < index; i++) {
				offset += getEffectiveSize(i);
			}

			if (align === 'center') {
				offset -= (el.clientHeight - getEffectiveSize(index)) / 2;
			} else if (align === 'end') {
				offset -= el.clientHeight - getEffectiveSize(index);
			}

			el.scrollTop = Math.max(0, offset);
		},
		[count, getEffectiveSize]
	);

	return { virtualItems: items, scrollHeight: total, scrollToIndex, scrollRef, measureElement };
}
