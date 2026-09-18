import { useCallback, useMemo, useRef, useState } from 'react';
import { FenwickTree } from '../fenwickTree';
import { useLatest } from './useLatest';

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
	const [scrollOffset, setScrollOffset] = useState<{ value: number }>({ value: 0 });
	const [forcedRange, setForcedRange] = useState<{ start: number; end: number } | null>(null);
	const scrollElementRef = useRef<HTMLElement | null>(null);
	const rafRef = useRef<number | null>(null);
	const observersRef = useRef<Map<number, { observer: ResizeObserver; element: HTMLElement }>>(new Map());
	const prevCountRef = useRef(count);
	const fenwickRef = useRef<FenwickTree | null>(null);
	const refCacheRef = useRef<Map<number, (el: HTMLElement | null) => void>>(new Map());
	const forcedRangeRef = useLatest(forcedRange);

	if (fenwickRef.current === null || !fenwickRef.current.total())
		fenwickRef.current = getFenwickTree(count, estimateSize);

	if (prevCountRef.current !== count) {
		fenwickRef.current = getFenwickTree(count, estimateSize);
		prevCountRef.current = count;
	}

	const pendingTargetRef = useRef<{ index: number; align: 'start' | 'center' | 'end' } | null>(null);

	const computeItems = useCallback(
		(physicalScrollOffset: number) => {
			const el = scrollElementRef.current;
			const tree = fenwickRef.current;
			if (!el || count === 0 || !tree) return { virtualItems: [], scrollHeight: 0 };

			const containerHeight = el.clientHeight;
			const logicalTotal = tree.total();
			const { scale, physicalTotal } = getScale(logicalTotal);

			const pendingTarget = pendingTargetRef.current;
			let logicalScrollOffset: number;

			if (pendingTarget !== null) {
				const targetIndex = Math.max(0, Math.min(pendingTarget.index, count - 1));
				const targetOffset = tree.prefixSum(targetIndex);
				const itemLogicalSize = tree.prefixSum(targetIndex + 1) - targetOffset;

				switch (pendingTarget.align) {
					case 'center':
						logicalScrollOffset = targetOffset + (itemLogicalSize - containerHeight / scale) / 2;
						break;
					case 'end':
						logicalScrollOffset = targetOffset + itemLogicalSize - containerHeight / scale;
						break;
					default:
						logicalScrollOffset = targetOffset;
				}

				const targetScrollTop = Math.max(0, logicalScrollOffset * scale);
				if (Math.abs(el.scrollTop - targetScrollTop) > 0.5) {
					el.scrollTop = targetScrollTop;
				}
			} else {
				logicalScrollOffset = physicalScrollOffset / scale;
			}

			let startIndex: number;
			let endIndex: number;

			if (forcedRange) {
				startIndex = forcedRange.start;
				endIndex = forcedRange.end;
			} else {
				const viewportStart = tree.findByPrefixSum(logicalScrollOffset);
				const viewportEnd = tree.findByPrefixSum(logicalScrollOffset + containerHeight / scale);
				startIndex = Math.max(viewportStart - overscan, 0);
				endIndex = Math.min(viewportEnd + overscan + 1, count);
			}

			const startOffsetLogical = tree.prefixSum(startIndex);
			const startOffsetPhysical =
				(pendingTarget !== null ? logicalScrollOffset * scale : physicalScrollOffset) +
				(startOffsetLogical - logicalScrollOffset) * scale;

			const virtualItems: VirtualItem[] = [];
			let offset = startOffsetPhysical;
			for (let i = startIndex; i < endIndex; i++) {
				const size = (tree.prefixSum(i + 1) - tree.prefixSum(i)) * scale;
				virtualItems.push({ index: i, start: offset, size, end: offset + size });
				offset += size;
			}

			return { virtualItems, scrollHeight: physicalTotal };
		},
		[count, forcedRange, overscan]
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

			const tree = fenwickRef.current;
			const { scale } = getScale(tree.total());
			const logicalHeight = height / scale;

			const prevSize = tree.prefixSum(index + 1) - tree.prefixSum(index);
			if (Math.abs(prevSize - logicalHeight) < 0.5) return;

			tree.update(index, logicalHeight - prevSize);
			setScrollOffset(prevState => ({ ...prevState }));
		});

		observer.observe(element);
		observersRef.current.set(index, { observer, element });
	}, []);

	const getMeasureRef = useCallback(
		(index: number) => {
			let fn = refCacheRef.current.get(index);
			if (!fn) {
				fn = (el: HTMLElement | null) => {
					measureElement(el, index);
					if (el === null) refCacheRef.current.delete(index);
				};
				refCacheRef.current.set(index, fn);
			}
			return fn;
		},
		[measureElement]
	);

	const handleScroll = useCallback(() => {
		if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

		rafRef.current = requestAnimationFrame(() => {
			const el = scrollElementRef.current;
			if (!el) return;
			setScrollOffset({ value: el.scrollTop });
			if (forcedRangeRef.current) {
				requestAnimationFrame(() => {
					requestAnimationFrame(() => {
						const el2 = scrollElementRef.current;
						pendingTargetRef.current = null;
						setForcedRange(null);
						if (el2) setScrollOffset({ value: el2.scrollTop });
					});
				});
			}
		});
	}, [forcedRangeRef]);

	const scrollRef = useCallback(
		(element: HTMLElement | null) => {
			if (scrollElementRef.current) scrollElementRef.current.removeEventListener('scroll', handleScroll);

			scrollElementRef.current = element;

			if (element) element.addEventListener('scroll', handleScroll, { passive: true });
			setScrollOffset(element ? { value: element?.scrollTop } : { value: 0 });
		},
		[handleScroll]
	);

	const { virtualItems, scrollHeight } = useMemo(
		() => computeItems(scrollOffset.value),
		[computeItems, scrollOffset]
	);

	const scrollToIndex = useCallback(
		(index: number, options?: { align?: 'start' | 'center' | 'end' }) => {
			if (index < 0 || index >= count) return;

			const align = options?.align ?? 'start';
			const rangeStart = Math.max(index - overscan, 0);
			const rangeEnd = Math.min(index + overscan + 1, count);

			pendingTargetRef.current = { index, align };
			setForcedRange({ start: rangeStart, end: rangeEnd });
			setScrollOffset(prevState => ({ ...prevState }));
		},
		[count, overscan]
	);

	return { virtualItems: virtualItems ?? [], scrollHeight, scrollToIndex, scrollRef, getMeasureRef };
}
