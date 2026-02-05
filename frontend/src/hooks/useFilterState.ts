import { useMemo, useState } from 'react';

type FilterValues = Record<string, string>;

export function useFilterState<T>(
  items: T[],
  initialFilters: FilterValues,
  filterFn: (item: T, filters: FilterValues) => boolean,
) {
  const [filters, setFilters] = useState(initialFilters);

  const filtered = useMemo(
    () => items.filter((item) => filterFn(item, filters)),
    [items, filters, filterFn],
  );

  const updateFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters(initialFilters);
  };

  const isFiltered = Object.entries(filters).some(
    ([key, value]) => value !== initialFilters[key],
  );

  return { filters, filtered, updateFilter, clearFilters, isFiltered };
}
