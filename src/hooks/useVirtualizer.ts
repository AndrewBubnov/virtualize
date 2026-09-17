import { useCallback, useMemo, useRef, useState } from 'react';
import { FenwickTree } from '../fenwickTree';

type VirtualItem = {
	index: number;
	start: number;
	size: number;
	end: number;
};

type UseVirtualizer = {
	count: number;
	estimateSize?: (index: number) => number;
	overscan?: number;
};

const DEFAULT_OVERSCAN = 3;
const DEFAULT_SIZE = 24;
const FORCE_RENDER = 0.000001;
const SAFE_MAX_HEIGHT = 15_000_000;

const getScale = (logicalTotal: number) => {
	if (logicalTotal <= SAFE_MAX_HEIGHT) return { scale: 1, physicalTotal: logicalTotal };
	return { scale: SAFE_MAX_HEIGHT / logicalTotal, physicalTotal: SAFE_MAX_HEIGHT };
};

const getFenwickTree = (count: number, estimateSize?: (index: number) => number) => {
	const sizes = new Float64Array(count);
	for (let i = 0; i < count; i++) sizes[i] = estimateSize?.(i) || DEFAULT_SIZE;
	return new FenwickTree(sizes);
};

export function useVirtualizer({ count, estimateSize, overscan = DEFAULT_OVERSCAN }: UseVirtualizer) {
	const [scrollOffset, setScrollOffset] = useState(0);
	const scrollElementRef = useRef<HTMLElement | null>(null);
	const rafRef = useRef<number | null>(null);
	const observersRef = useRef<Map<number, { observer: ResizeObserver; element: HTMLElement }>>(new Map());
	const prevCountRef = useRef(count);

	const fenwickRef = useRef<FenwickTree | null>(null);

	if (fenwickRef.current === null || !fenwickRef.current.total())
		fenwickRef.current = getFenwickTree(count, estimateSize);

	if (prevCountRef.current !== count) {
		fenwickRef.current = getFenwickTree(count, estimateSize);
		prevCountRef.current = count;
	}

	const computeItems = useCallback(
		(physicalScrollOffset: number) => {
			const el = scrollElementRef.current;
			const tree = fenwickRef.current;
			if (!el || count === 0 || !tree) return { virtualItems: [], scrollHeight: 0 };

			const containerHeight = el.clientHeight;
			const logicalTotal = tree.total();
			const { scale, physicalTotal } = getScale(logicalTotal);
			const logicalScrollOffset = physicalScrollOffset / scale;
			const viewportStart = tree.findByPrefixSum(logicalScrollOffset);
			const viewportEnd = tree.findByPrefixSum(logicalScrollOffset + containerHeight / scale);
			const startIndex = Math.max(viewportStart - overscan, 0);
			const endIndex = Math.min(viewportEnd + overscan + 1, count);

			const startOffsetLogical = tree.prefixSum(startIndex);
			const startOffsetPhysical = physicalScrollOffset + (startOffsetLogical - logicalScrollOffset) * scale;

			const virtualItems: VirtualItem[] = [];
			let offset = startOffsetPhysical;
			for (let i = startIndex; i < endIndex; i++) {
				const size = tree.prefixSum(i + 1) - tree.prefixSum(i);
				virtualItems.push({ index: i, start: offset, size, end: offset + size });
				offset += size;
			}

			return { virtualItems, scrollHeight: physicalTotal };
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

			fenwickRef.current.update(index, height - prevSize);
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
			const tree = fenwickRef.current;
			if (!el || !tree || index < 0 || index >= count) return;

			const { scale } = getScale(tree.total());
			const align = options?.align ?? 'start';

			const logicalOffset = tree.prefixSum(index);
			const size = tree.prefixSum(index + 1) - logicalOffset;

			let physicalOffset = logicalOffset * scale;

			if (align === 'center') {
				physicalOffset -= (el.clientHeight - size) / 2;
			} else if (align === 'end') {
				physicalOffset -= el.clientHeight - size;
			}

			el.scrollTop = Math.max(0, physicalOffset);
		},
		[count]
	);

	return { virtualItems: virtualItems ?? [], scrollHeight, scrollToIndex, scrollRef, measureElement };
}
