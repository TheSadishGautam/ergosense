declare module 'brightness' {
  export function get(): Promise<number>;
  export function set(level: number): Promise<void>;
}
