import { CSSProperties, useState } from 'react';
import styles from './Expandable.module.css';

export const Expandable = ({ children }: { children: string }) => {
	const [isExpanded, setIsExpanded] = useState(false);
	return (
		<div
			style={
				{
					'--content': 'Click to expand',
					'--color': 'red',
				} as CSSProperties
			}
			className={styles.expanded}
			onClick={() => setIsExpanded(prevState => !prevState)}
		>
			{isExpanded ? `${children} ${children} ${children}` : children}
		</div>
	);
};
