import { useCallback, useMemo, useRef, useState } from 'react';
import { useLatest } from './useLatest';

type VirtualItem = {
	index: number;
	start: number;
	size: number;
	end: number;
};

type Options = {
	count: number;
	estimateSize: (index: number) => number;
	overscan?: number;
};

const DEFAULT_OVERSCAN = 3;
const FORCE_RENDER = 0.000001;

export function useVirtualizer({ count, estimateSize, overscan = DEFAULT_OVERSCAN }: Options) {
	const [scrollOffset, setScrollOffset] = useState(0);
	const scrollElementRef = useRef<HTMLElement | null>(null);
	const rafRef = useRef<number | null>(null);
	const observersRef = useRef<Map<number, { observer: ResizeObserver; element: HTMLElement }>>(new Map());
	const measuredCacheRef = useRef<Map<number, number>>(new Map());
	const estimateSizeRef = useLatest(estimateSize);

	const offsets: number[] = useMemo(() => new Array(count), [count]);

	const getEffectiveSize = useCallback(
		(index: number) => measuredCacheRef.current.get(index) ?? estimateSizeRef.current(index),
		[estimateSizeRef]
	);

	const computeItems = useCallback(
		(scrollOffset: number) => {
			const el = scrollElementRef.current;
			if (!el || count === 0) return { items: [], total: 0 };

			const containerHeight = el.clientHeight;

			let scrollHeight = 0;
			for (let i = 0; i < count; i++) {
				offsets[i] = scrollHeight;
				scrollHeight += getEffectiveSize(i);
			}

			let startIndex = 0;
			while (startIndex < count && offsets[startIndex] < scrollOffset) startIndex++;

			startIndex = Math.max(startIndex - overscan, 0);

			let endIndex = startIndex;
			while (endIndex < count && offsets[endIndex] - offsets[startIndex] < containerHeight) endIndex++;
			endIndex = Math.min(endIndex + overscan, count);

			const virtualItems: VirtualItem[] = [];
			for (let i = startIndex; i < endIndex; i++) {
				const size = getEffectiveSize(i);
				const start = offsets[i];
				virtualItems.push({ index: i, start, size, end: start + size });
			}

			return { virtualItems, scrollHeight };
		},
		[count, getEffectiveSize, offsets, overscan]
	);

	const handleScroll = useCallback(() => {
		if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

		rafRef.current = requestAnimationFrame(() => {
			const el = scrollElementRef.current;
			if (el) setScrollOffset(el.scrollTop);
		});
	}, []);

	const scrollRef = useCallback(
		(element: HTMLElement | null) => {
			if (scrollElementRef.current) scrollElementRef.current.removeEventListener('scroll', handleScroll);

			scrollElementRef.current = element;

			if (element) element.addEventListener('scroll', handleScroll, { passive: true });
			setScrollOffset(element?.scrollTop || FORCE_RENDER);
		},
		[handleScroll]
	);

	const measureElement = useCallback((element: HTMLElement | null, index: number) => {
		if (!element) {
			const entry = observersRef.current.get(index);
			if (entry) {
				entry.observer.disconnect();
				observersRef.current.delete(index);
			}
			return;
		}

		const existing = observersRef.current.get(index);
		if (existing && existing.element === element) return;

		if (existing) {
			existing.observer.disconnect();
			observersRef.current.delete(index);
		}

		const observer = new ResizeObserver(([entry]) => {
			const height = entry?.borderBoxSize[0]?.blockSize;
			if (height == null) return;

			const prev = measuredCacheRef.current.get(index);
			if (prev === height) return;

			measuredCacheRef.current.set(index, height);
			setScrollOffset(prevState => prevState + FORCE_RENDER);
		});

		observer.observe(element);
		observersRef.current.set(index, { observer, element });
	}, []);

	const { virtualItems, scrollHeight } = useMemo(() => computeItems(scrollOffset), [computeItems, scrollOffset]);

	const scrollToIndex = useCallback(
		(index: number, options?: { align?: 'start' | 'center' | 'end' }) => {
			const el = scrollElementRef.current;
			if (!el || index < 0 || index >= count) return;

			const align = options?.align ?? 'start';
			let offset = 0;
			for (let i = 0; i < index; i++) offset += getEffectiveSize(i);

			if (align === 'center') {
				offset -= (el.clientHeight - getEffectiveSize(index)) / 2;
			} else if (align === 'end') {
				offset -= el.clientHeight - getEffectiveSize(index);
			}

			el.scrollTop = Math.max(0, offset);
		},
		[count, getEffectiveSize]
	);

	return { virtualItems: virtualItems ?? [], scrollHeight, scrollToIndex, scrollRef, measureElement };
}
