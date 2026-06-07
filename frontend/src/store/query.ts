import { createAtom } from '@tanstack/react-store'

export const queryStore = createAtom<string>('');
export const queryLoadingStore = createAtom<boolean>(false);
