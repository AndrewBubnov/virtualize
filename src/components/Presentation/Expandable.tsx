import { useState } from 'react';
import styles from './Expandable.module.css';

export const Expandable = ({ children }: { children: string }) => {
	const [isExpanded, setIsExpanded] = useState(false);
	const toggleExpand = () => setIsExpanded(prevState => !prevState);

	return (
		<div className={styles.expanded} onClick={toggleExpand}>
			{isExpanded ? `${children} ${children} ${children}` : children}
		</div>
	);
};
