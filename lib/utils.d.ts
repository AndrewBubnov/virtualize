import { FenwickTree } from './fenwickTree';
type SettleScroll = 'converged' | 'stale-tree' | 'user';
export declare const getScale: (logicalTotal: number) => {
    scale: number;
    physicalTotal: number;
};
export declare const getFenwickTree: (count: number, estimateSize?: ((index: number) => number) | undefined) => FenwickTree;
export declare const classifySettleScroll: (scrollTop: number, targetScrollTop: number, version: number, baseVersion: number) => SettleScroll;
export declare const getViewportRange: (tree: FenwickTree, logicalScrollOffset: number, containerHeight: number, scale: number, overscanValue: number, countValue: number) => {
    startIndex: number;
    endIndex: number;
    viewportStart: number;
    viewportEnd: number;
};
export declare const computeTargetScrollTop: (tree: FenwickTree, index: number, align: 'start' | 'center' | 'end', containerHeight: number, scale: number, count: number) => {
    targetScrollTop: number;
    logicalScrollOffset: number;
};
export {};
