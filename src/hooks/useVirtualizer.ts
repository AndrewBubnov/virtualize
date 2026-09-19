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

const DEFAULT_OVERSCAN = 3; // Extra items rendered above/below the viewport.
const DEFAULT_SIZE = 24; // Fallback item height in px until measured.
const SAFE_MAX_HEIGHT = 15_000_000; // Max scrollable height in browsers; larger totals are scaled down.

const SETTLE_STABLE_FRAMES = 3; // Consecutive matching frames required to advance or release the settle.
const SETTLE_MAX_FRAMES = 180; // Settle timeout in frames (~3s at 60fps), then release unconditionally.
const SETTLE_MAX_ATTEMPTS = 3; // Settle retries when the target misses the viewport.
const SCROLL_CONVERGED_THRESHOLD = 0.5; // Physical px within which two scroll positions count as equal.
const SETTLE_WINDOW = 40; // Items rendered on each side of the target while settling.

const getScale = (logicalTotal: number) => {
	if (logicalTotal <= SAFE_MAX_HEIGHT) return { scale: 1, physicalTotal: logicalTotal };
	return { scale: SAFE_MAX_HEIGHT / logicalTotal, physicalTotal: SAFE_MAX_HEIGHT };
};

const getFenwickTree = (count: number, estimateSize?: (index: number) => number) => {
	const sizes = new Float64Array(count);
	for (let i = 0; i < count; i++) sizes[i] = estimateSize?.(i) || DEFAULT_SIZE;
	return new FenwickTree(sizes);
};

const computeTargetScrollTop = (
	tree: FenwickTree,
	index: number,
	align: 'start' | 'center' | 'end',
	containerHeight: number,
	scale: number,
	count: number
) => {
	const targetIndex = Math.max(0, Math.min(index, count - 1));
	const targetOffset = tree.prefixSum(targetIndex);
	const itemLogicalSize = tree.prefixSum(targetIndex + 1) - targetOffset;

	let logicalScrollOffset: number;
	switch (align) {
		case 'center':
			logicalScrollOffset = targetOffset + (itemLogicalSize - containerHeight / scale) / 2;
			break;
		case 'end':
			logicalScrollOffset = targetOffset + itemLogicalSize - containerHeight / scale;
			break;
		default:
			logicalScrollOffset = targetOffset;
	}

	return { targetScrollTop: Math.max(0, logicalScrollOffset * scale), logicalScrollOffset };
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
	const countRef = useLatest(count);
	const overscanRef = useLatest(overscan);

	if (fenwickRef.current === null || !fenwickRef.current.total())
		fenwickRef.current = getFenwickTree(count, estimateSize);

	if (prevCountRef.current !== count) {
		fenwickRef.current = getFenwickTree(count, estimateSize);
		prevCountRef.current = count;
	}

	const pendingTargetRef = useRef<{ index: number; align: 'start' | 'center' | 'end' } | null>(null);
	const settlingRef = useRef(false);
	const phaseRef = useRef<1 | 2>(1);
	const settleRafRef = useRef<number | null>(null);
	const settleFramesRef = useRef(0);
	const stableFramesRef = useRef(0);
	const versionStableFramesRef = useRef(0);
	const lastVersionRef = useRef(-1);
	const attemptRef = useRef(0);
	const treeVersionRef = useRef(0);
	const programmaticCountRef = useRef(0);
	const seenProgrammaticRef = useRef(0);
	const assertedRef = useRef<{ value: number; total: number } | null>(null);

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
				const { targetScrollTop, logicalScrollOffset: targetLogicalOffset } = computeTargetScrollTop(
					tree,
					pendingTarget.index,
					pendingTarget.align,
					containerHeight,
					scale,
					count
				);
				logicalScrollOffset = targetLogicalOffset;

				if (Math.abs(el.scrollTop - targetScrollTop) > SCROLL_CONVERGED_THRESHOLD) {
					el.scrollTop = targetScrollTop;
					programmaticCountRef.current += 1;
					assertedRef.current = { value: targetScrollTop, total: logicalTotal };
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
			treeVersionRef.current += 1;
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

	const cancelSettleTimers = useCallback(() => {
		if (settleRafRef.current !== null) {
			cancelAnimationFrame(settleRafRef.current);
			settleRafRef.current = null;
		}
	}, []);

	const resetSettleState = useCallback(() => {
		settleFramesRef.current = 0;
		stableFramesRef.current = 0;
		versionStableFramesRef.current = 0;
		lastVersionRef.current = -1;
		attemptRef.current = 0;
		phaseRef.current = 1;
	}, []);

	const cancelSettle = useCallback(
		(scrollTop: number) => {
			if (settleRafRef.current !== null) {
				cancelAnimationFrame(settleRafRef.current);
				settleRafRef.current = null;
			}
			pendingTargetRef.current = null;
			settlingRef.current = false;
			assertedRef.current = null;
			resetSettleState();
			setForcedRange(null);
			setScrollOffset({ value: scrollTop });
		},
		[resetSettleState]
	);

	const scheduleSettleTick = useCallback(() => {
		if (settleRafRef.current !== null) return;
		settleRafRef.current = requestAnimationFrame(() => {
			settleRafRef.current = null;
			const el = scrollElementRef.current;
			const tree = fenwickRef.current;
			const pending = pendingTargetRef.current;
			if (!el || !tree || !pending || !settlingRef.current) return;

			const countValue = countRef.current;
			const overscanValue = overscanRef.current;
			settleFramesRef.current += 1;
			if (settleFramesRef.current > SETTLE_MAX_FRAMES) {
				cancelSettle(el.scrollTop);
				return;
			}

			const { scale } = getScale(tree.total());
			const { targetScrollTop } = computeTargetScrollTop(
				tree,
				pending.index,
				pending.align,
				el.clientHeight,
				scale,
				countValue
			);

			if (Math.abs(el.scrollTop - targetScrollTop) > SCROLL_CONVERGED_THRESHOLD) {
				const asserted = assertedRef.current;
				const total = tree.total();
				if (
					asserted !== null &&
					total === asserted.total &&
					Math.abs(el.scrollTop - asserted.value) > SCROLL_CONVERGED_THRESHOLD
				) {
					cancelSettle(el.scrollTop);
					return;
				}
				stableFramesRef.current = 0;
				setScrollOffset(prevState => ({ ...prevState }));
				scheduleSettleTick();
				return;
			}

			stableFramesRef.current += 1;
			if (treeVersionRef.current !== lastVersionRef.current) {
				lastVersionRef.current = treeVersionRef.current;
				versionStableFramesRef.current = 0;
			} else {
				versionStableFramesRef.current += 1;
			}

			const settled =
				stableFramesRef.current >= SETTLE_STABLE_FRAMES &&
				versionStableFramesRef.current >= SETTLE_STABLE_FRAMES;
			if (!settled) {
				scheduleSettleTick();
				return;
			}

			if (phaseRef.current === 1) {
				phaseRef.current = 2;
				stableFramesRef.current = 0;
				versionStableFramesRef.current = 0;
				lastVersionRef.current = treeVersionRef.current;
				setForcedRange(null);
				setScrollOffset(prevState => ({ ...prevState }));
				scheduleSettleTick();
				return;
			}

			const targetIndex = Math.max(0, Math.min(pending.index, countValue - 1));
			const logical = el.scrollTop / scale;
			const viewportStart = tree.findByPrefixSum(logical);
			const viewportEnd = tree.findByPrefixSum(logical + el.clientHeight / scale);
			const inViewport =
				targetIndex >= viewportStart - overscanValue && targetIndex <= viewportEnd + overscanValue;

			if (!inViewport && attemptRef.current < SETTLE_MAX_ATTEMPTS) {
				attemptRef.current += 1;
				stableFramesRef.current = 0;
				versionStableFramesRef.current = 0;
				setScrollOffset(prevState => ({ ...prevState }));
				scheduleSettleTick();
				return;
			}

			cancelSettle(el.scrollTop);
		});
	}, [cancelSettle, countRef, overscanRef]);

	const handleScroll = useCallback(() => {
		if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

		rafRef.current = requestAnimationFrame(() => {
			rafRef.current = null;
			const el = scrollElementRef.current;
			if (!el) return;
			if (settlingRef.current && pendingTargetRef.current !== null) {
				if (seenProgrammaticRef.current < programmaticCountRef.current) {
					seenProgrammaticRef.current = programmaticCountRef.current;
				} else {
					cancelSettle(el.scrollTop);
					return;
				}
			}
			setScrollOffset({ value: el.scrollTop });
		});
	}, [cancelSettle]);

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

	const startSettle = useCallback(
		(index: number, align: 'start' | 'center' | 'end') => {
			if (rafRef.current !== null) {
				cancelAnimationFrame(rafRef.current);
				rafRef.current = null;
			}
			cancelSettleTimers();
			resetSettleState();
			seenProgrammaticRef.current = programmaticCountRef.current;
			assertedRef.current = null;
			pendingTargetRef.current = { index, align };
			settlingRef.current = true;
			const rangeStart = Math.max(index - SETTLE_WINDOW, 0);
			const rangeEnd = Math.min(index + SETTLE_WINDOW + 1, count);
			setForcedRange({ start: rangeStart, end: rangeEnd });
			setScrollOffset(prevState => ({ ...prevState }));
			scheduleSettleTick();
		},
		[count, cancelSettleTimers, resetSettleState, scheduleSettleTick]
	);

	const scrollToIndex = useCallback(
		(index: number, options?: { align?: 'start' | 'center' | 'end' }) => {
			if (index < 0 || index >= count) return;

			startSettle(index, options?.align ?? 'start');
		},
		[count, startSettle]
	);

	return { virtualItems: virtualItems ?? [], scrollHeight, scrollToIndex, scrollRef, getMeasureRef };
}
