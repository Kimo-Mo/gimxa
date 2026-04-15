'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { topupService } from '@/services/topup.service';
import type { AdminTopupGame } from '@/types/admin/topups';
import type { PaginatedResponse } from '@/types/common';
import type { ProductCategory } from '@/types/catalog';
import { toast } from 'sonner';
import { catalogService } from '@/services/catalog.service';
import { authService } from '@/services/auth.service';

// Extracted Components
import { TopupListHeader } from '@/components/admin/topups/TopupListHeader';
import { TopupListFilters } from '@/components/admin/topups/TopupListFilters';
import { TopupTable } from '@/components/admin/topups/TopupTable';
import { TopupPagination } from '@/components/admin/topups/TopupPagination';
import { DeleteTopupDialog } from '@/components/admin/topups/DeleteTopupDialog';

const PAGE_SIZE = 10;

export default function AdminTopupsPage() {
  const [topups, setTopups] = useState<AdminTopupGame[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [pagination, setPagination] = useState({ count: 0, total_pages: 1, current_page: 1 });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteSlug, setDeleteSlug] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, categoryId]);

  const fetchTopups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page, page_size: PAGE_SIZE };
      if (debouncedSearch) params.search = debouncedSearch;
      // if (categoryId !== 'all') params.category = categoryId;
      const data = (await topupService.adminTopupsList(
        params as Parameters<typeof topupService.adminTopupsList>[0]
      )) as PaginatedResponse<AdminTopupGame>;
      // filter topups by category on the client side
      const filteredTopups =
        categoryId === 'all'
          ? data?.results
          : data?.results?.filter((topup) =>
              topup?.product?.categories?.some((category) => String(category?.id) === categoryId)
            );
      setTopups(filteredTopups ?? []);
      setPagination({
        count: filteredTopups?.length ?? 0,
        total_pages: data?.total_pages ?? 1,
        current_page: data?.current_page ?? 1,
      });
    } catch {
      setError('Failed to load top-ups. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, categoryId]);

  useEffect(() => {
    catalogService
      .adminCategoriesList()
      .then((data) => {
        const topupCats = (Array.isArray(data) ? data : (data?.results ?? [])).filter(
          (category: ProductCategory) => category.name.startsWith('Topup')
        );
        setCategories(topupCats);
      })
      .catch(() => []);
  }, []);

  useEffect(() => {
    fetchTopups();
  }, [fetchTopups]);

  const handleDelete = async () => {
    if (!deleteSlug) return;
    setDeleting(true);
    try {
      await catalogService.adminDeleteProduct(deleteSlug);
      toast.success('Top-up deleted successfully.');
      await authService.clearCache();
      fetchTopups();
    } catch {
      toast.error('Failed to delete top-up.');
    } finally {
      setDeleting(false);
      setDeleteSlug(null);
    }
  };

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
          paginationCount={pagination.count}
        />
        <CardContent>
          <TopupTable
            topups={topups}
            loading={loading}
            error={error}
            setDeleteSlug={setDeleteSlug}
          />

          <TopupPagination
            current_page={pagination.current_page}
            total_pages={pagination.total_pages}
            count={pagination.count}
            loading={loading}
            setPage={setPage}
          />
        </CardContent>
      </Card>

      <DeleteTopupDialog
        deleteSlug={deleteSlug}
        setDeleteSlug={setDeleteSlug}
        deleting={deleting}
        handleDelete={handleDelete}
      />
    </div>
  );
}
