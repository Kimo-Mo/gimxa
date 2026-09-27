'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useTopupsQuery } from '@/hooks/admin/useTopupsQuery';
import { useDeleteTopupMutation } from '@/hooks/admin/useDeleteTopupMutation';
import { useCategoriesQuery } from '@/hooks/admin/useCategoriesQuery';

// Extracted Components
import { TopupListHeader } from '@/components/admin/topups/TopupListHeader';
import { TopupListFilters } from '@/components/admin/topups/TopupListFilters';
import { TopupTable } from '@/components/admin/topups/TopupTable';
import { TopupPagination } from '@/components/admin/topups/TopupPagination';
import { DeleteTopupDialog } from '@/components/admin/topups/DeleteTopupDialog';

export default function AdminTopupsPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [page, setPage] = useState(1);
  const [deleteSlug, setDeleteSlug] = useState<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPage(1);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [debouncedSearch, categoryId]);

  const topupsQuery = useTopupsQuery({ page, search: debouncedSearch });
  const deleteMutation = useDeleteTopupMutation();
  const categoriesQuery = useCategoriesQuery();

  const categories = (categoriesQuery.data ?? []).filter((c) => c.name.startsWith('Topup'));
  const topups = (topupsQuery.data?.results ?? []).filter(
    (t) => categoryId === 'all' || t?.product?.categories?.some((c) => String(c?.id) === categoryId)
  );
  const loading = topupsQuery.isPending;

  const count = topups.length;
  const current_page = topupsQuery.data?.current_page ?? 1;
  const total_pages = topupsQuery.data?.total_pages ?? 1;

  return (
    <div className="space-y-8">
      <TopupListHeader />

      <Card className="bg-card border-border shadow-sm">
        <TopupListFilters
          search={search}
          setSearch={setSearch}
          categoryId={categoryId}
          setCategoryId={setCategoryId}
          categories={categories}
          paginationCount={count}
        />
        <CardContent>
          <TopupTable
            topups={topups}
            loading={loading}
            error={topupsQuery.isError ? 'Failed to load top up. Please try again.' : null}
            setDeleteSlug={setDeleteSlug}
          />

          <TopupPagination
            current_page={current_page}
            total_pages={total_pages}
            count={count}
            loading={loading}
            setPage={setPage}
          />
        </CardContent>
      </Card>

      <DeleteTopupDialog
        deleteSlug={deleteSlug}
        setDeleteSlug={setDeleteSlug}
        deleting={deleteMutation.isPending}
        handleDelete={() => {
          if (deleteSlug) deleteMutation.mutate(deleteSlug);
          setDeleteSlug(null);
        }}
      />
    </div>
  );
}
