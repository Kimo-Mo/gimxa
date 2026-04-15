'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { codeService } from '@/services/code.service';
import { catalogService } from '@/services/catalog.service';
import type { AdminCode } from '@/types/admin/codes';
import type { Product } from '@/types';
import { toast } from 'sonner';
import { CodesFilters } from '@/components/admin/codes/CodesFilters';
import { CodesTable } from '@/components/admin/codes/CodesTable';
import { DeleteCodeDialog } from '@/components/admin/codes/DeleteCodeDialog';
import { authService } from '@/services/auth.service';

export default function AdminCodesPage() {
  const [codes, setCodes] = useState<AdminCode[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    slug?: string;
    product_slug?: string;
    package_id?: number | null;
    id: number;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const getCodeDisplayName = useCallback(
    (code: AdminCode) => {
      const codeLike = code as AdminCode & {
        package_name?: string;
        game_name?: string;
        product_name?: string;
        package_title?: string;
      };

      const directName =
        codeLike.package_name ??
        codeLike.game_name ??
        codeLike.product_name ??
        codeLike.package_title;
      if (directName) return directName;

      if (code.product_slug) {
        const bySlug = products.find((prod) => prod.slug === code.product_slug);
        if (bySlug?.name) return bySlug.name;
      }

      if (selectedProduct && selectedProduct !== 'all') {
        const selected = products.find((prod) => prod.slug === selectedProduct);
        if (selected?.name) return selected.name;
      }

      if (code.id) return `#${code.id}`;
      return '—';
    },
    [products, selectedProduct]
  );

  // Debounce search
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(id);
  }, [search]);

  // Load product list for dropdown filter
  useEffect(() => {
    async function loadProducts() {
      setProductsLoading(true);
      try {
        const data = await catalogService.adminProductsList({ page_size: 100 });
        setProducts(data?.results ?? []);
      } catch {
        // silently fail — user can still use the page
      } finally {
        setProductsLoading(false);
      }
    }
    loadProducts();
  }, []);

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data =
        selectedProduct === 'all'
          ? await codeService.adminCodeListAll()
          : await codeService.adminCodeListForProduct(selectedProduct);
      const results = Array.isArray(data)
        ? data
        : ((selectedProduct === 'all' ? data?.results : data?.codes) ?? []);
      const searchValue = debouncedSearch.trim().toLowerCase();
      const filtered = searchValue
        ? results.filter((c: AdminCode) => {
            const codeText = c.code?.toLowerCase() ?? '';
            const labelText = getCodeDisplayName(c).toLowerCase();
            const packageText = c.package_id ? String(c.package_id) : '';
            return (
              codeText.includes(searchValue) ||
              labelText.includes(searchValue) ||
              packageText.includes(searchValue)
            );
          })
        : results;
      setCodes(filtered);
    } catch {
      setError(
        selectedProduct === 'all'
          ? 'Failed to load codes. Please try again.'
          : 'Failed to load codes for this product.'
      );
    } finally {
      setLoading(false);
    }
  }, [selectedProduct, debouncedSearch, getCodeDisplayName]);

  useEffect(() => {
    fetchCodes();
  }, [fetchCodes]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const candidateSlugs = Array.from(
        new Set(
          [
            deleteTarget.slug,
            deleteTarget.product_slug,
            selectedProduct !== 'all' ? selectedProduct : '',
            ...products
              .filter((prod) => prod.id === deleteTarget.package_id)
              .map((prod) => prod.slug),
          ].filter((slug): slug is string => Boolean(slug))
        )
      );

      let deleted = false;
      for (const slug of candidateSlugs) {
        try {
          await codeService.adminDeleteSingleCode(slug, deleteTarget.id);
          deleted = true;
          break;
        } catch {
          continue;
        }
      }

      if (!deleted) {
        for (const product of products) {
          try {
            const data = await codeService.adminCodeListForProduct(product.slug);
            const list = Array.isArray(data) ? data : (data?.codes ?? []);
            const exists = list.some((item: AdminCode) => item.id === deleteTarget.id);
            if (!exists) continue;
            await codeService.adminDeleteSingleCode(product.slug, deleteTarget.id);
            deleted = true;
            break;
          } catch {
            continue;
          }
        }
      }

      if (!deleted) {
        throw new Error('DELETE_FAILED');
      }

      toast.success('Code deleted successfully.');
      await authService.clearCache();
      fetchCodes();
    } catch {
      toast.error('Failed to delete code.');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const getProductSlugForCode = (code: AdminCode) => {
    const bySlug = code.product_slug
      ? products.find((prod) => prod.slug === code.product_slug)
      : undefined;
    if (bySlug?.slug) return bySlug.slug;

    if (selectedProduct && selectedProduct !== 'all') return selectedProduct;

    const byId = products.find((prod) => prod.id === code.package_id);
    return byId?.slug ?? '';
  };

  const handleEditCode = async (code: AdminCode, nextCodeValue: string) => {
    const candidateSlugs = Array.from(
      new Set(
        [
          code.product_slug,
          getProductSlugForCode(code),
          selectedProduct !== 'all' ? selectedProduct : '',
        ].filter((slug): slug is string => Boolean(slug))
      )
    );

    for (const slug of candidateSlugs) {
      try {
        await codeService.adminUpdateSingleCode(slug, code.id, { code: nextCodeValue });
        toast.success('Code updated successfully.');
        fetchCodes();
        return;
      } catch {
        continue;
      }
    }

    for (const product of products) {
      try {
        const data = await codeService.adminCodeListForProduct(product.slug);
        const list = Array.isArray(data) ? data : (data?.codes ?? []);
        const exists = list.some((item: AdminCode) => item.id === code.id);
        if (!exists) continue;
        await codeService.adminUpdateSingleCode(product.slug, code.id, { code: nextCodeValue });
        toast.success('Code updated successfully.');
        fetchCodes();
        return;
      } catch {
        continue;
      }
    }

    toast.error('Failed to update code.');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Code Vault</h1>
        <p className="text-muted-foreground mt-1">Manage fulfillment codes for digital products.</p>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <CardTitle className="text-foreground">
              Codes{' '}
              {codes.length > 0 && (
                <span className="text-muted-foreground font-normal text-sm ml-1">
                  ({codes.length})
                </span>
              )}
            </CardTitle>
            <CodesFilters
              selectedProduct={selectedProduct}
              onSelectedProductChange={setSelectedProduct}
              products={products}
              productsLoading={productsLoading}
              search={search}
              onSearchChange={setSearch}
              loading={loading}
              onRefresh={fetchCodes}
            />
          </div>
        </CardHeader>
        <CardContent>
          <CodesTable
            codes={codes}
            loading={loading}
            error={error || null}
            selectedProduct={selectedProduct}
            getCodeDisplayName={getCodeDisplayName}
            onEdit={handleEditCode}
            onDelete={(code) =>
              setDeleteTarget({
                slug: code.product_slug ?? getProductSlugForCode(code),
                product_slug: code.product_slug,
                package_id: code.package_id,
                id: code.id,
              })
            }
          />
        </CardContent>
      </Card>

      <DeleteCodeDialog
        open={!!deleteTarget}
        deleting={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onDelete={handleDelete}
      />
    </div>
  );
}
