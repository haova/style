type DeepRequired<T> = T extends object
  ? { [K in keyof T]-?: DeepRequired<NonNullable<T[K]>> }
  : T;

export interface HaoVAOptions {
  color?: {
    format?: 'oklch';
    primary?: string;
    dark?: {
      primary?: string;
    };
  };
}

export type ResolvedOptions = DeepRequired<HaoVAOptions>;

export const DEFAULT_COLOR_PRIMARY = 'oklch(0.72 0.1 190)';
export const DEFAULT_COLOR_FORMAT = 'oklch';
