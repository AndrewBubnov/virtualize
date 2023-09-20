import { useState } from 'react';
import styles from './Expandable.module.css';

enum TooltipLabel {
	EXPAND = 'Click to expand',
	COLLAPSE = 'Click to collapse',
}

export const Expandable = ({ children }: { children: string }) => {
	const [isExpanded, setIsExpanded] = useState(false);
	const toggleExpand = () => setIsExpanded(prevState => !prevState);

	return (
		<div
			className={styles.expanded}
			onClick={toggleExpand}
			data-tooltip={isExpanded ? TooltipLabel.COLLAPSE : TooltipLabel.EXPAND}
		>
			{isExpanded ? `${children} ${children} ${children}` : children}
		</div>
	);
};
