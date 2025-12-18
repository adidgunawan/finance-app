import type { AccountType } from "@/lib/types";

export const ACCOUNT_TYPE_ORDER: AccountType[] = [
  "Asset",
  "Liability",
  "Equity",
  "Income",
  "Expense",
];

export function groupByAccountTypeOrder<T>(
  items: T[],
  getType: (item: T) => AccountType,
  typeOrder: AccountType[] = ACCOUNT_TYPE_ORDER
): Array<{ type: AccountType; items: T[] }> {
  const groups: Array<{ type: AccountType; items: T[] }> = [];

  for (const type of typeOrder) {
    const typed = items.filter((item) => getType(item) === type);
    if (typed.length > 0) groups.push({ type, items: typed });
  }

  return groups;
}

export function filterItemsWithAncestorHierarchy<T>(
  items: T[],
  searchTerm: string,
  options: {
    getId: (item: T) => string;
    getParentId: (item: T) => string | null | undefined;
    matches: (item: T, loweredTerm: string) => boolean;
  }
): T[] {
  if (!searchTerm) return items;
  const term = searchTerm.toLowerCase().trim();
  if (!term) return items;

  const byId = new Map<string, T>();
  for (const item of items) byId.set(options.getId(item), item);

  const includedIds = new Set<string>();
  const directlyMatching = items.filter((item) => options.matches(item, term));

  for (const item of directlyMatching) {
    let current: T | undefined = item;
    while (current) {
      const id = options.getId(current);
      if (includedIds.has(id)) break;
      includedIds.add(id);

      const parentId = options.getParentId(current);
      if (!parentId) break;
      current = byId.get(parentId);
    }
  }

  return items.filter((item) => includedIds.has(options.getId(item)));
}


