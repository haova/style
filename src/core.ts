import {
  DEFAULT_COLOR_FORMAT,
  DEFAULT_COLOR_PRIMARY,
  type HaoVAOptions,
  type ResolvedOptions,
} from './config';
import { parseColor, formatColor } from './color';

export function createHaoVAStyle(input: HaoVAOptions = {}): ResolvedOptions {
  const colorFormat = input.color?.format ?? DEFAULT_COLOR_FORMAT;
  const primaryColor = parseColor(
    input.color?.primary ?? DEFAULT_COLOR_PRIMARY,
  );
  const darkPrimaryColor =
    input.color?.dark?.primary === undefined
      ? primaryColor
      : parseColor(input.color.dark.primary);

  return {
    color: {
      format: colorFormat,
      primary: formatColor(primaryColor, colorFormat),
      dark: {
        primary: formatColor(darkPrimaryColor, colorFormat),
      },
    },
  };
}
