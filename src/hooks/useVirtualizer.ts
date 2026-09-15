import { useCallback, useMemo, useRef, useState } from 'react';

export type VirtualItem = {
	index: number;
	start: number;
	size: number;
	end: number;
};

export type VirtualizerOptions = {
	count: number;
	getScrollElement: () => HTMLElement | null;
	estimateSize: (index: number) => number;
	overscan?: number;
};

export type Virtualizer = {
	getVirtualItems: () => VirtualItem[];
	getTotalSize: () => number;
	scrollToIndex: (index: number, options?: { align?: 'start' | 'center' | 'end' }) => void;
	scrollRef: (element: HTMLElement | null) => void;
};

const DEFAULT_OVERSCAN = 3;

export function useVirtualizer(options: VirtualizerOptions): Virtualizer {
	const { count, getScrollElement, estimateSize, overscan = DEFAULT_OVERSCAN } = options;

	const [scrollOffset, setScrollOffset] = useState(0);
	const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null);
	const scrollElementRef = useRef<HTMLElement | null>(null);
	const getScrollElementRef = useRef(getScrollElement);
	const rafRef = useRef<number | null>(null);

	const totalSize = useMemo(() => {
		let size = 0;
		for (let i = 0; i < count; i++) {
			size += estimateSize(i);
		}
		return size;
	}, [count, estimateSize]);

	const virtualItems = useMemo(() => {
		const el = scrollElementRef.current;
		if (!el || count === 0) return [];

		const containerHeight = el.clientHeight;

		let startIndex = 0;
		let offset = 0;
		while (startIndex < count && offset < scrollOffset) {
			offset += estimateSize(startIndex);
			startIndex++;
		}

		startIndex = Math.max(startIndex - overscan, 0);

		let endIndex = startIndex;
		let accumulated = 0;
		while (endIndex < count && accumulated < containerHeight) {
			accumulated += estimateSize(endIndex);
			endIndex++;
		}
		endIndex = Math.min(endIndex + overscan, count);

		const items: VirtualItem[] = [];
		let start = 0;
		for (let i = 0; i < startIndex; i++) {
			start += estimateSize(i);
		}

		for (let i = startIndex; i < endIndex; i++) {
			const size = estimateSize(i);
			items.push({ index: i, start, size, end: start + size });
			start += size;
		}

		return items;
	}, [scrollOffset, count, estimateSize, overscan, scrollElement]);

	const handleScroll = useCallback(() => {
		if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

		rafRef.current = requestAnimationFrame(() => {
			const el = getScrollElementRef.current();
			if (el) setScrollOffset(el.scrollTop);
		});
	}, []);

	const scrollRef = useCallback(
		(element: HTMLElement | null) => {
			if (scrollElementRef.current) {
				scrollElementRef.current.removeEventListener('scroll', handleScroll);
			}
			scrollElementRef.current = element;
			if (element) {
				element.addEventListener('scroll', handleScroll, { passive: true });
				setScrollOffset(element.scrollTop);
			}
			setScrollElement(element);
		},
		[handleScroll]
	);

	const scrollToIndex = useCallback(
		(index: number, options?: { align?: 'start' | 'center' | 'end' }) => {
			const el = scrollElementRef.current;
			if (!el || index < 0 || index >= count) return;

			const align = options?.align ?? 'start';
			let offset = 0;
			for (let i = 0; i < index; i++) {
				offset += estimateSize(i);
			}

			if (align === 'center') {
				offset -= (el.clientHeight - estimateSize(index)) / 2;
			} else if (align === 'end') {
				offset -= el.clientHeight - estimateSize(index);
			}

			el.scrollTop = Math.max(0, offset);
		},
		[estimateSize, count]
	);

	return { getVirtualItems: () => virtualItems, getTotalSize: () => totalSize, scrollToIndex, scrollRef };
}
