/** A complete read or an explicit error: never return a silently truncated dataset. */
export async function readAllPages<T>(page: (from: number, to: number) => PromiseLike<{data: T[] | null; error: any}>, size = 250): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += size) {
    const result = await page(from, from + size - 1);
    if (result.error) throw new Error(result.error.message || 'Data fetch failed. Please retry.');
    if (!result.data) throw new Error('Server returned no dataset. Please retry.');
    rows.push(...result.data);
    if (result.data.length < size) return rows;
    if (rows.length >= 100000) throw new Error('Dataset too large for a browser export; request a filtered export.');
  }
}
