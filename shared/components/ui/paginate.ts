export function paginationRange(page: number, perPage: number, total: number): { from: number; to: number } {
  if (total <= 0) return { from: 0, to: 0 };

  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  return { from, to };
}
