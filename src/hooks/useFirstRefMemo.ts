import { useRef } from 'react';

export const useFirstRefMemo = <T>(value: T) => {
	const ref = useRef(value);
	return ref.current;
};
