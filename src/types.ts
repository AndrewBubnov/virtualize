import { ReactElement, ReactNode } from 'react';

export interface VirtualizedProps {
	items: ReactElement[];
}
export type CacheItem = { offset: number; height: number };

export interface SetHeightArgs {
	index: number;
	offset: number;
}
export interface UseAutoSizeProps {
	onResize(height: number): void;
	onMount(height: number): void;
}
export interface AutoSizerProps extends UseAutoSizeProps {
	children: ReactNode;
	offset: number;
}
