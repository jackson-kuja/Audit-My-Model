declare module 'jotai' {
  export function atom<T>(initialValue: T): any;
  export function useAtom<T>(atom: any): [T, (value: T) => void];
} 