import { ReactNode } from 'react';

export interface VirtualizedProps {
	items: string[];
}
export type CacheItem = { offset: number; height: number };

export interface AutoSizerProps {
	children: ReactNode;
	offset: number;
	onHeightSet(height: number): void;
}
