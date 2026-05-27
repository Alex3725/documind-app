export type KeyFn<T> = (item: T) => string;

/**
 * Find all items in a sorted array whose key starts with `prefix`.
 * Complexity: O(log n) to find insertion point + O(k) to collect k matches.
 */
export function binaryPrefixSearch<T>(arr: T[], keyFn: KeyFn<T>, prefix: string): T[] {
  if (!prefix || prefix.length === 0) return [];

  let lo = 0;
  let hi = arr.length;

  // find lower bound: first index where itemKey.slice(0, prefix.length) >= prefix
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    const midKey = keyFn(arr[mid]).slice(0, prefix.length);
    if (midKey.localeCompare(prefix) < 0) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }

  const results: T[] = [];

  // expand right from lo
  for (let i = lo; i < arr.length; i++) {
    const k = keyFn(arr[i]);
    if (k.slice(0, prefix.length) === prefix) results.push(arr[i]);
    else break;
  }

  // expand left from lo-1
  for (let i = lo - 1; i >= 0; i--) {
    const k = keyFn(arr[i]);
    if (k.slice(0, prefix.length) === prefix) results.unshift(arr[i]);
    else break;
  }

  return results;
}

export default binaryPrefixSearch;
