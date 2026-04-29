import { useState, useEffect } from 'react';

export function useNotificationFilters() {
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [isRead, setIsRead] = useState<boolean | undefined>(undefined);
  const [isEmailed, setIsEmailed] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // reset to page 1 whenever search term changes
    }, 400);

    return () => clearTimeout(handler);
  }, [search]);

  const resetPage = () => setPage(1);

  return {
    search,
    debouncedSearch,
    isRead,
    isEmailed,
    page,
    setSearch,
    setIsRead,
    setIsEmailed,
    setPage,
    resetPage,
  };
}
