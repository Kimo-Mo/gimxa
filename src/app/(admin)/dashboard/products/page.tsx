'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { catalogService } from '@/services/catalog.service';
import type { Product, PaginatedResponse, ProductCategory } from '@/types';
import { toast } from 'sonner';
import { authService } from '@/services/auth.service';

// Extracted Components
import { ProductListHeader } from '@/components/admin/products/ProductListHeader';
import { ProductListFilters } from '@/components/admin/products/ProductListFilters';
import { ProductTable } from '@/components/admin/products/ProductTable';
import { ProductPagination } from '@/components/admin/products/ProductPagination';
import { DeleteProductDialog } from '@/components/admin/products/DeleteProductDialog';

const PAGE_SIZE = 10;

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState({ count: 0, total_pages: 1, current_page: 1 });
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteSlug, setDeleteSlug] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Debounce search
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, categoryId]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filterParts: string[] = [];
      if (categoryId !== 'all') filterParts.push(`category=${categoryId}`);
      const data = (await catalogService.adminProductsList({
        page,
        page_size: PAGE_SIZE,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(filterParts.length > 0 ? { filter: filterParts.join(',') } : {}),
      })) as PaginatedResponse<Product>;
      // Filter topup products on the client side
      const results = (data?.results ?? []).filter((p) => p.product_type !== 'topup');
      setProducts(results);
      setPagination({
        count: results.length,
        total_pages: data?.total_pages ?? 1,
        current_page: data?.current_page ?? 1,
      });
    } catch {
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, categoryId]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    catalogService
      .adminCategoriesList()
      .then((data) => {
        const productsCategories = (Array.isArray(data) ? data : (data?.results ?? [])).filter(
          (category: ProductCategory) => !category.name.startsWith('Topup')
        );
        setCategories(productsCategories);
      })
      .catch(() => []);
  }, []);

  const handleDelete = async () => {
    if (!deleteSlug) return;
    setDeleting(true);
    try {
      await catalogService.adminDeleteProduct(deleteSlug);
      toast.success('Product deleted successfully.');
      await authService.clearCache();
      fetchProducts();
    } catch {
      toast.error('Failed to delete product.');
    } finally {
      setDeleting(false);
      setDeleteSlug(null);
    }
  };

  return (
    <div className="space-y-8">
      <ProductListHeader />

      <Card className="bg-card border-border shadow-sm">
        <ProductListFilters
          search={search}
          setSearch={setSearch}
          categoryId={categoryId}
          setCategoryId={setCategoryId}
          categories={categories}
          productCount={pagination.count}
        />
        {error ? (
          <div className="text-center py-12 text-destructive text-sm">{error}</div>
        ) : (
          <CardContent>
            <ProductTable products={products} loading={loading} setDeleteSlug={setDeleteSlug} />

            <ProductPagination
              current_page={pagination.current_page}
              total_pages={pagination.total_pages}
              count={pagination.count}
              loading={loading}
              setPage={setPage}
            />
          </CardContent>
        )}
      </Card>

      <DeleteProductDialog
        deleteSlug={deleteSlug}
        setDeleteSlug={setDeleteSlug}
        deleting={deleting}
        handleDelete={handleDelete}
      />
    </div>
  );
}
