export type SortDir = "asc" | "desc";

export function compare<T>(a: T, b: T): number {
  if (a === b) return 0;
  // @ts-ignore
  return a < b ? -1 : 1;
}

export function sortBy<T extends Record<string, any>>(arr: T[], key: keyof T, dir: SortDir = "asc"): T[] {
  const sorted = [...arr];
  sorted.sort((x, y) => {
    const res = compare(x[key], y[key]);
    return dir === "asc" ? res : -res;
  });
  return sorted;
}

export function paginate<T>(arr: T[], page: number, pageSize: number) {
  const total = arr.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  return { total, totalPages, currentPage, slice: arr.slice(start, end) };
}
