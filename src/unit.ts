export interface Unit {
  value: number;
  unit: string;
}

const UNIT_PATTERN = /^([+-]?(?:\d+\.?\d*|\.\d+))([a-z%]*)$/i;

export function parseUnit(
  input: number | string | undefined,
  defaultUnit: string,
  fallback: Unit = { value: 0, unit: defaultUnit },
): Unit {
  if (typeof input === 'number') {
    return Number.isFinite(input)
      ? { value: input, unit: defaultUnit }
      : fallback;
  }

  const match = input === undefined ? null : UNIT_PATTERN.exec(input.trim());
  if (!match) return fallback;

  return { value: Number(match[1]), unit: match[2] || defaultUnit };
}

export function formatUnit(input: Unit): string {
  return `${Number(input.value.toFixed(4))}${input.unit}`;
}
