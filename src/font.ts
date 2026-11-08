const FONT_IDENTIFIER = /^[a-z_-][\w-]*$/i;

export function parseFont(
  input: string | string[] | undefined,
  fallback: string[] = [],
): string[] {
  if (input === undefined) return fallback;

  const names = (typeof input === 'string' ? input.split(',') : input)
    .map((name) =>
      name
        .trim()
        .replace(/^["']|["']$/g, '')
        .trim(),
    )
    .filter((name) => name !== '');

  return names.length > 0 ? names : fallback;
}

export function formatFont(input: string[]): string {
  return input
    .map((name) => (FONT_IDENTIFIER.test(name) ? name : `"${name}"`))
    .join(', ');
}
