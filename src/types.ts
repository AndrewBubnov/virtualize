import { ReactElement, ReactNode } from 'react';

export interface VirtualizedProps {
	items: ReactElement[];
}
export type CacheItem = { offset: number; height: number };

export interface AutoSizerProps {
	children: ReactNode;
	offset: number;
	onInitHeightSet(height: number): void;
	onResize(height: number): void;
}
export interface SetHeightArgs {
	index: number;
	offset: number;
}
export interface UseAutoSizeProps {
	onResize(height: number): void;
	onInitHeightSet(height: number): void;
}
