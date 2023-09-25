import { AutoSizer } from 'components/AutoSizer/AutoSizer.tsx';
import { useVirtualize } from 'hooks/useVirtualize.ts';
import { VirtualizedProps } from 'types.ts';
import styles from './Virtualized.module.css';

export const Virtualized = ({ items }: VirtualizedProps) => {
	const { rows, handlers, scrollHeight, containerRef, scrollHandler } = useVirtualize(items);
	return (
		<div onScroll={scrollHandler} className={styles.container} ref={containerRef}>
			<div style={{ height: `${scrollHeight}px` }}>
				{rows.map(el => {
					const { onMount, onResize } = handlers[el.index];
					return (
						<AutoSizer key={el.index} offset={el.transform} onMount={onMount} onResize={onResize}>
							{el.content}
						</AutoSizer>
					);
				})}
			</div>
		</div>
	);
};
