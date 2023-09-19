import { useState } from 'react';
import styles from './Expandable.module.css';

export const Expandable = ({ children }: { children: string }) => {
	const [isExpanded, setIsExpanded] = useState(false);
	return (
		<div className={styles.expanded} onClick={() => setIsExpanded(prevState => !prevState)}>
			{isExpanded ? `${children} ${children} ${children}` : children}
		</div>
	);
};
