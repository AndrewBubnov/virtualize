import { useCallback, useMemo, useRef, useState } from 'react';

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
};

const DEFAULT_OVERSCAN = 3;

export function useVirtualizer({ count, estimateSize, overscan = DEFAULT_OVERSCAN }: VirtualizerOptions): Virtualizer {
	const [scrollOffset, setScrollOffset] = useState(0);
	const [isRefSet, setIsRefSet] = useState(false);
	const scrollElementRef = useRef<HTMLElement | null>(null);
	const rafRef = useRef<number | null>(null);

	const scrollHeight = useMemo(() => {
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
	}, [scrollOffset, count, estimateSize, overscan, isRefSet]);

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

			if (element) {
				element.addEventListener('scroll', handleScroll, { passive: true });
				setScrollOffset(element.scrollTop);
			}
			setIsRefSet(true);
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

	return { virtualItems, scrollHeight, scrollToIndex, scrollRef };
}
