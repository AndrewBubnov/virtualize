import { FenwickTree } from './fenwickTree';
import { SCROLL_CONVERGED_THRESHOLD } from './constants';

type SettleScroll = 'converged' | 'stale-tree' | 'user';

const DEFAULT_SIZE = 24; // Fallback item height in px until measured.
const SAFE_MAX_HEIGHT = 15_000_000; // Max scrollable height in browsers; larger totals are scaled down.

export const getScale = (logicalTotal: number) => {
	if (logicalTotal <= SAFE_MAX_HEIGHT) return { scale: 1, physicalTotal: logicalTotal };
	return { scale: SAFE_MAX_HEIGHT / logicalTotal, physicalTotal: SAFE_MAX_HEIGHT };
};

export const getFenwickTree = (count: number, estimateSize?: (index: number) => number) => {
	const sizes = new Float64Array(count);
	for (let i = 0; i < count; i++) sizes[i] = estimateSize?.(i) || DEFAULT_SIZE;
	return new FenwickTree(sizes);
};

export const classifySettleScroll = (
	scrollTop: number,
	targetScrollTop: number,
	version: number,
	baseVersion: number
): SettleScroll => {
	if (Math.abs(scrollTop - targetScrollTop) <= SCROLL_CONVERGED_THRESHOLD) return 'converged';
	return version !== baseVersion ? 'stale-tree' : 'user';
};

export const getViewportRange = (
	tree: FenwickTree,
	logicalScrollOffset: number,
	containerHeight: number,
	scale: number,
	overscanValue: number,
	countValue: number
) => {
	const viewportStart = tree.findByPrefixSum(logicalScrollOffset);
	const viewportEnd = tree.findByPrefixSum(logicalScrollOffset + containerHeight / scale);
	return {
		startIndex: Math.max(viewportStart - overscanValue, 0),
		endIndex: Math.min(viewportEnd + overscanValue + 1, countValue),
		viewportStart,
		viewportEnd,
	};
};

export const computeTargetScrollTop = (
	tree: FenwickTree,
	index: number,
	align: 'start' | 'center' | 'end',
	containerHeight: number,
	scale: number,
	count: number,
	headerHeight: number = 0
) => {
	const targetIndex = Math.max(0, Math.min(index, count - 1));
	const targetOffset = tree.prefixSum(targetIndex);
	const itemLogicalSize = tree.prefixSum(targetIndex + 1) - targetOffset;
	const visibleHeight = Math.max(containerHeight - headerHeight, 0);

	// Returned logicalScrollOffset is the top of the *visible* window (below the
	// sticky header): logical == (scrollTop + header) / scale, so the physical
	// target is logical * scale - header and the row lands below the header.
	let logicalScrollOffset: number;
	switch (align) {
		case 'center':
			logicalScrollOffset = targetOffset + (itemLogicalSize - visibleHeight / scale) / 2;
			break;
		case 'end':
			logicalScrollOffset = targetOffset + itemLogicalSize - visibleHeight / scale;
			break;
		default:
			logicalScrollOffset = targetOffset;
	}

	// Whole pixels only: a fractional scrollTop leaves the sticky header on a
	// fractional offset and the browser may paint a 1px sliver above it.
	return { targetScrollTop: Math.round(Math.max(0, logicalScrollOffset * scale - headerHeight)), logicalScrollOffset };
};
