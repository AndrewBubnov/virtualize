import { AutoSizer } from 'components/AutoSizer/AutoSizer.tsx';
import { useVirtualize } from 'hooks/useVirtualize.ts';
import { VirtualizedProps } from 'types.ts';
import styles from './Virtualized.module.css';

export const Virtualized = ({ items }: VirtualizedProps) => {
	const { virtualizedRows, initSizeHandler, resizeHandler, scrollHeight, container, scrollHandler } =
		useVirtualize(items);
	return (
		<div onScroll={scrollHandler} className={styles.container} ref={container}>
			<div style={{ height: `${scrollHeight}px` }}>
				{virtualizedRows.map(el => (
					<AutoSizer
						key={el.index}
						offset={el.transform}
						onInitHeightSet={initSizeHandler(el.index)}
						onResize={resizeHandler(el.index)}
					>
						{el.content}
					</AutoSizer>
				))}
			</div>
		</div>
	);
};
