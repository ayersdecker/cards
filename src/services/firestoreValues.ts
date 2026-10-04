export function sanitizeFirestoreValue(value: unknown): unknown {
  if (value === undefined) return undefined;

  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeFirestoreValue(item))
      .filter((item) => item !== undefined);
  }

  if (value && typeof value === 'object') {
    const next: Record<string, unknown> = {};
    for (const [key, entryValue] of Object.entries(value)) {
      const sanitized = sanitizeFirestoreValue(entryValue);
      if (sanitized !== undefined) next[key] = sanitized;
    }
    return next;
  }

  return value;
}
