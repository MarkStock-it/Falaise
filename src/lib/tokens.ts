/**
 * Content fields may use a small, fixed set of percent tokens so the owner can
 * write copy once and have the studio details filled in at render time.
 * Supported: %HANDLE% (Instagram handle), %CITY% (studio city).
 */
export function fillTokens(
  value: string,
  tokens: Record<string, string | undefined>,
): string {
  let result = value
  for (const [name, replacement] of Object.entries(tokens)) {
    if (!replacement) continue
    result = result.replaceAll(`%${name.toUpperCase()}%`, replacement)
  }
  return result
}
