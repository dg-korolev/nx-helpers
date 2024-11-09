export function arrayUniq<T>(array: T[]): T[] {
  if (!array || !array.length) {
    return [];
  }
  return [...new Set(array)];
}
