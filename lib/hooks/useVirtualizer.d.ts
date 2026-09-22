export type VirtualItem = {
    index: number;
    start: number;
    size: number;
    end: number;
};
export type Options = {
    count: number;
    estimateSize?: (index: number) => number;
    overscan?: number;
};
export type ScrollAlign = 'start' | 'center' | 'end';
export declare function useVirtualizer({ count, estimateSize, overscan }: Options): {
    virtualItems: VirtualItem[];
    scrollHeight: number;
    scrollToIndex: (index: number, options?: {
        align?: ScrollAlign;
    }) => void;
    scrollRef: (element: HTMLElement | null) => void;
    getMeasureRef: (index: number) => (el: HTMLElement | null) => void;
};
