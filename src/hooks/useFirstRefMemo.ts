import { useRef } from 'react';

export const useFirstRefMemo = <T>(value: T) => {
	const ref = useRef<T>(value);

	return ref.current;
};
