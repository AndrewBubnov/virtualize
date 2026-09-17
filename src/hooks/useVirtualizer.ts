import { useCallback, useMemo, useRef, useState } from 'react';
import { useLatest } from './useLatest';
import { FenwickTree } from '../fenwickTree';

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
	const prevCountRef = useRef(count);

	const estimateSizeRef = useLatest(estimateSize);

	const getEffectiveSize = useCallback(
		(index: number) => measuredCacheRef.current.get(index) ?? estimateSizeRef.current(index),
		[estimateSizeRef]
	);

	const fenwickRef = useRef<FenwickTree | null>(null);
	if (fenwickRef.current === null || !fenwickRef.current.total()) {
		const sizes = new Float64Array(count);
		for (let i = 0; i < count; i++) sizes[i] = estimateSizeRef.current(i);
		fenwickRef.current = new FenwickTree(sizes);
	}

	if (prevCountRef.current !== count) {
		const sizes = new Float64Array(count);
		for (let i = 0; i < count; i++) sizes[i] = estimateSizeRef.current(i);
		fenwickRef.current = new FenwickTree(sizes);
		prevCountRef.current = count;
	}

	const computeItems = useCallback(
		(scrollOffset: number) => {
			const el = scrollElementRef.current;
			const tree = fenwickRef.current;
			if (!el || count === 0 || !tree) return { virtualItems: [], scrollHeight: 0 };
			const containerHeight = el.clientHeight;
			const viewportStart = tree.findByPrefixSum(scrollOffset);
			const viewportEnd = tree.findByPrefixSum(scrollOffset + containerHeight);
			const startIndex = Math.max(viewportStart - overscan, 0);
			const endIndex = Math.min(viewportEnd + overscan + 1, count);
			const startOffset = tree.prefixSum(startIndex);
			const virtualItems: VirtualItem[] = [];
			let offset = startOffset;
			for (let i = startIndex; i < endIndex; i++) {
				const size = tree.prefixSum(i + 1) - tree.prefixSum(i);
				virtualItems.push({ index: i, start: offset, size, end: offset + size });
				offset += size;
			}
			return { virtualItems, scrollHeight: tree.total() };
		},
		[count, overscan]
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
			if (height == null || !fenwickRef.current) return;

			const prevSize = fenwickRef.current.prefixSum(index + 1) - fenwickRef.current.prefixSum(index);
			if (prevSize === height) return;

			fenwickRef.current.update(index, height - prevSize); // O(log n), не весь пересчёт
			setScrollOffset(prevState => prevState + FORCE_RENDER);
		});

		observer.observe(element);
		observersRef.current.set(index, { observer, element });
	}, []);

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
