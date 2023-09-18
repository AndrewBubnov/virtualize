import { AutoSizer } from 'components/AutoSizer/AutoSizer.tsx';
import { VirtualizedProps } from 'types.ts';
import styles from './Virtualized.module.css';
import { useVirtualize } from 'hooks/useVirtualize.ts';

export const Virtualized = ({ items }: VirtualizedProps) => {
	const { virtualizedRows, sizeHandler, scrollHeight, container, scrollHandler } = useVirtualize(items);
	return (
		<div onScroll={scrollHandler} className={styles.container} ref={container}>
			<div style={{ height: `${scrollHeight}px` }}>
				{virtualizedRows.map(el => (
					<AutoSizer key={el.index} offset={el.transform} onHeightSet={sizeHandler(el.index)}>
						{el.text}
					</AutoSizer>
				))}
			</div>
		</div>
	);
};
