import { useCallback, useMemo, useRef, useState } from 'react';
import { FenwickTree } from '../fenwickTree';
import { useLatest } from './useLatest';
import { classifySettleScroll, computeTargetScrollTop, getFenwickTree, getScale, getViewportRange } from '../utils';
import { DEFAULT_OVERSCAN, SCROLL_CONVERGED_THRESHOLD, SETTLE_MAX_FRAMES, SETTLE_QUIET_FRAMES, SETTLE_WINDOW } from '../constants';

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

type PendingTarget = {
	index: number;
	align: 'start' | 'center' | 'end';
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
	const pendingTargetRef = useRef<PendingTarget | null>(null);
	const tickRafRef = useRef<number | null>(null);
	const settleFramesRef = useRef(0);
	const quietFramesRef = useRef(0);
	const treeVersionRef = useRef(0);
	const versionAtJumpRef = useRef(0);

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
				const { startIndex: viewportStartIndex, endIndex: viewportEndIndex } = getViewportRange(
					tree,
					logicalScrollOffset,
					containerHeight,
					scale,
					overscan,
					count
				);
				startIndex = viewportStartIndex;
				endIndex = viewportEndIndex;
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

	const releaseSettle = useCallback((scrollTop: number) => {
		if (tickRafRef.current !== null) {
			cancelAnimationFrame(tickRafRef.current);
			tickRafRef.current = null;
		}
		pendingTargetRef.current = null;
		setForcedRange(null);
		setScrollOffset({ value: scrollTop });
	}, []);

	const scheduleTick = useCallback(() => {
		if (tickRafRef.current !== null) return;
		tickRafRef.current = requestAnimationFrame(() => {
			tickRafRef.current = null;
			const el = scrollElementRef.current;
			const tree = fenwickRef.current;
			const pending = pendingTargetRef.current;
			if (!el || !tree || !pending) return;

			const countValue = countRef.current;
			const overscanValue = overscanRef.current;
			settleFramesRef.current += 1;
			if (settleFramesRef.current > SETTLE_MAX_FRAMES) {
				releaseSettle(el.scrollTop);
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
			const kind = classifySettleScroll(
				el.scrollTop,
				targetScrollTop,
				treeVersionRef.current,
				versionAtJumpRef.current
			);
			if (kind === 'user') {
				releaseSettle(el.scrollTop);
				return;
			}
			if (kind === 'stale-tree') {
				versionAtJumpRef.current = treeVersionRef.current;
				quietFramesRef.current = 0;
				setScrollOffset(prevState => ({ ...prevState }));
				scheduleTick();
				return;
			}
			if (treeVersionRef.current !== versionAtJumpRef.current) {
				versionAtJumpRef.current = treeVersionRef.current;
				quietFramesRef.current = 0;
			} else {
				quietFramesRef.current += 1;
			}
			if (quietFramesRef.current < SETTLE_QUIET_FRAMES) {
				scheduleTick();
				return;
			}
			const { startIndex, endIndex } = getViewportRange(
				tree,
				el.scrollTop / scale,
				el.clientHeight,
				scale,
				overscanValue,
				countValue
			);
			const targetIndex = Math.max(0, Math.min(pending.index, countValue - 1));
			if (targetIndex < startIndex || targetIndex > endIndex) {
				releaseSettle(el.scrollTop);
				return;
			}
			releaseSettle(el.scrollTop);
		});
	}, [releaseSettle, countRef, overscanRef]);

	const handleScroll = useCallback(() => {
		if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

		rafRef.current = requestAnimationFrame(() => {
			rafRef.current = null;
			const el = scrollElementRef.current;
			const tree = fenwickRef.current;
			if (!el || !tree) return;
			const pending = pendingTargetRef.current;
			if (pending !== null) {
				const { scale } = getScale(tree.total());
				const { targetScrollTop } = computeTargetScrollTop(
					tree,
					pending.index,
					pending.align,
					el.clientHeight,
					scale,
					countRef.current
				);
				const kind = classifySettleScroll(
					el.scrollTop,
					targetScrollTop,
					treeVersionRef.current,
					versionAtJumpRef.current
				);
				if (kind === 'user') {
					releaseSettle(el.scrollTop);
					return;
				}
				if (kind === 'stale-tree') versionAtJumpRef.current = treeVersionRef.current;
			}
			setScrollOffset({ value: el.scrollTop });
		});
	}, [releaseSettle, countRef]);

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

	const jumpToIndex = useCallback(
		(index: number, align: 'start' | 'center' | 'end') => {
			if (rafRef.current !== null) {
				cancelAnimationFrame(rafRef.current);
				rafRef.current = null;
			}
			if (tickRafRef.current !== null) {
				cancelAnimationFrame(tickRafRef.current);
				tickRafRef.current = null;
			}
			settleFramesRef.current = 0;
			quietFramesRef.current = 0;
			pendingTargetRef.current = { index, align };
			versionAtJumpRef.current = treeVersionRef.current;
			const rangeStart = Math.max(index - SETTLE_WINDOW, 0);
			const rangeEnd = Math.min(index + SETTLE_WINDOW + 1, count);
			setForcedRange({ start: rangeStart, end: rangeEnd });
			setScrollOffset(prevState => ({ ...prevState }));
			scheduleTick();
		},
		[count, scheduleTick]
	);

	const scrollToIndex = useCallback(
		(index: number, options?: { align?: 'start' | 'center' | 'end' }) => {
			if (index < 0 || index >= count) return;
			jumpToIndex(index, options?.align ?? 'start');
		},
		[count, jumpToIndex]
	);

	return { virtualItems: virtualItems ?? [], scrollHeight, scrollToIndex, scrollRef, getMeasureRef };
}
