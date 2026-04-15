'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { topupService } from '@/services/topup.service';
import { dashboardService } from '@/services/dashboard.service';
import { catalogService } from '@/services/catalog.service';
import { codeService } from '@/services/code.service';
import type { AdminTopupGame, AdminTopupGameField, AdminTopupPackage } from '@/types/admin/topups';
import type { ProductCategory } from '@/types/catalog';
import { toast } from 'sonner';
import { authService } from '@/services/auth.service';

import { EditTopupHeader } from '@/components/admin/topups/EditTopupHeader';
import { GameInfoTab } from '@/components/admin/topups/GameInfoTab';
import { FieldsTab } from '@/components/admin/topups/FieldsTab';
import { PackagesTab } from '@/components/admin/topups/PackagesTab';
import { DeleteConfirmDialog } from '@/components/admin/topups/DeleteConfirmDialog';
import type { FieldForm, PackageForm, FieldType, StockMode } from '@/components/admin/topups/types';

const defaultField = (): FieldForm => ({
  title: '',
  placeholder: '',
  key: '',
  field_type: 'text',
  is_required: true,
  order: 0,
  min_input_length: 1,
  helps: [],
});

const defaultPackage = (): PackageForm => ({
  name: '',
  amount: '',
  price: '',
  is_active: true,
  is_popular: false,
  order: 0,
  stock_mode: 'manual', // default manual for topups
  manual_fulfillment_time: '',
  codes: '',
});

export default function AdminTopupDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [topup, setTopup] = useState<AdminTopupGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Game Info state
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [gameName, setGameName] = useState('');
  const [region, setRegion] = useState('global');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [shortDescription, setShortDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);
  const [savingGameInfo, setSavingGameInfo] = useState(false);
  const [gameInfoErrors, setGameInfoErrors] = useState<Record<string, string>>({});
  const [isActive, setIsActive] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  // Fields state
  const [fields, setFields] = useState<FieldForm[]>([]);
  const [savingFields, setSavingFields] = useState(false);

  // Packages state
  const [packages, setPackages] = useState<PackageForm[]>([]);
  const [savingPackages, setSavingPackages] = useState(false);

  // Delete target
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'field' | 'package';
    id: number;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Inline validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<number, Record<string, string>>>({});
  const [pkgErrors, setPkgErrors] = useState<Record<number, Record<string, string>>>({});

  useEffect(() => {
    catalogService
      .adminCategoriesList()
      .then((data) => {
        const topupCategories = (Array.isArray(data) ? data : (data?.results ?? [])).filter(
          (category: ProductCategory) => category.name.startsWith('Topup')
        );
        setCategories(topupCategories);
      })
      .catch(() => []);
  }, []);

  const loadData = async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    Promise.all([
      topupService.adminTopupDetail(slug),
      catalogService.adminGetProduct(slug).catch(() => null),
      topupService.adminPackagesList(slug).catch(() => null),
    ])
      .then(([data, productData, pkgResponse]) => {
        setTopup(data);
        if (productData) {
          setGameName(productData.name || '');
          setRegion(productData.region || 'global');
          setShortDescription(productData.short_description || '');
          setIsActive(data.is_active ?? true);
          setIsAvailable(productData.is_available ?? true);
          setIsFeatured(productData.is_featured ?? false);
          if (productData.categories && productData.categories.length > 0) {
            setSelectedCategory(String(productData.categories[0].id));
          } else {
            setSelectedCategory('');
          }
          if (productData.images && productData.images.length > 0) {
            const mainImg =
              productData.images.find((img: { image: string; is_main: boolean }) => img.is_main) ||
              productData.images[0];
            setCurrentLogo(mainImg.image || null);
          } else {
            setCurrentLogo(productData.main_image?.image || data.logo || null);
          }
        } else {
          // Fallback when adminGetProduct fails — use data from TopUpGameAdminSerializer
          setGameName(data.product?.name || '');
          setCurrentLogo(data.product?.main_image?.image || data.logo || null);
          setIsAvailable(data.product?.is_available ?? true);
          setIsFeatured(data.product?.is_featured ?? false);
          setIsActive(data.is_active ?? true);
          if (data.product?.categories && data.product.categories.length > 0) {
            setSelectedCategory(String(data.product.categories[0].id));
          }
        }

        // Init fields form
        setFields(
          (data.fields ?? []).map((f: AdminTopupGameField) => ({
            id: f.id,
            title: f.title,
            placeholder: f.placeholder,
            key: f.key,
            field_type: f.field_type as FieldType,
            is_required: f.is_required,
            order: f.order,
            min_input_length: f.min_input_length,
            helps: (f.helps ?? []).map(
              (h: { id: number; description: string; image: string | null }) => ({
                id: h.id,
                description: h.description,
                imageFile: null,
                imageUrl: h.image ?? null,
              })
            ),
          }))
        );
        // Get packages from adminPackagesList (paginated response: { results: [...] })
        const rawPkgs: AdminTopupPackage[] =
          pkgResponse?.results ??
          pkgResponse?.data?.results ??
          (Array.isArray(pkgResponse) ? pkgResponse : []);
        setPackages(
          rawPkgs.map((p: AdminTopupPackage) => ({
            id: p.id,
            name: p.name,
            amount: p.amount,
            price: String(p.price),
            is_active: p.is_active,
            is_popular: p.is_popular,
            order: p.order,
            stock_mode: (p.stock_mode as StockMode) ?? 'manual',
            manual_fulfillment_time: p.manual_fulfillment_time
              ? String(p.manual_fulfillment_time)
              : '',
            codes: '',
          }))
        );
      })
      .catch(() => setError('Failed to load top-up details.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // ── Game Info helpers ─────────────────────────────────────────────
  const handleSaveGameInfo = async () => {
    const errs: Record<string, string> = {};
    if (!gameName.trim()) errs.name = 'Game name is required.';
    if (!selectedCategory) errs.category = 'Category is required.';

    if (Object.keys(errs).length > 0) {
      setGameInfoErrors(errs);
      toast.error('Please fix game info errors.');
      return;
    }

    setGameInfoErrors({});
    setSavingGameInfo(true);

    try {
      const formData = new FormData();
      formData.append('name', gameName.trim());
      formData.append('region', region);
      formData.append('category', selectedCategory);
      formData.append('short_description', shortDescription.trim());
      formData.append('product_type', 'topup');
      formData.append('is_available', String(isAvailable));
      formData.append('is_featured', String(isFeatured));
      formData.append('is_active', String(isActive));
      if (imageFile) {
        formData.append('logo', imageFile);
        formData.append('images[0][image]', imageFile);
        formData.append('images[0][is_main]', 'true');
      }

      await dashboardService.adminUpdateProductFull(slug, formData);
      await topupService.adminUpdateTopup(slug, { is_active: isActive });
      await authService.clearCache();
      toast.success('Game info updated successfully.');
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { message?: string } } };
      toast.error(errorResponse.response?.data?.message || 'Failed to update game info.');
    } finally {
      setSavingGameInfo(false);
    }
  };

  // ── Field helpers ─────────────────────────────────────────────────
  const addField = () => setFields((prev) => [...prev, defaultField()]);

  const updateField = (i: number, key: keyof FieldForm, value: unknown) => {
    setFields((prev) => prev.map((f, idx) => (idx === i ? { ...f, [key]: value } : f)));
  };

  const removeFieldLocally = (i: number) => {
    setFields((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleDeleteHelp = async (fieldIndex: number, helpIndex: number, helpId?: number) => {
    if (helpId) {
      try {
        await topupService.adminDeleteFieldHelp(helpId);
      } catch {
        toast.error('Failed to delete help item.');
        return;
      }
    }
    const currentHelps = fields[fieldIndex]?.helps ?? [];
    updateField(
      fieldIndex,
      'helps',
      currentHelps.filter((_, idx) => idx !== helpIndex)
    );
  };

  const handleSaveFields = async () => {
    const newErrors: Record<number, Record<string, string>> = {};
    fields.forEach((f, i) => {
      const e: Record<string, string> = {};
      if (!f.title.trim()) e.title = 'Title is required.';
      if (Object.keys(e).length) newErrors[i] = e;
    });
    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      toast.error('Please fix field errors before saving.');
      return;
    }
    setFieldErrors({});
    setSavingFields(true);
    try {
      for (const field of fields) {
        const payload = {
          title: field.title,
          placeholder: field.placeholder,
          key: field.key,
          field_type: field.field_type,
          is_required: field.is_required,
          order: field.order,
          min_input_length: field.min_input_length,
        };
        if (field.id) {
          await topupService.adminUpdateField(field.id, payload);
          for (const help of field.helps ?? []) {
            const helpFormData = new FormData();
            helpFormData.append('description', help.description);
            helpFormData.append('field', String(field.id));
            if (help.imageFile) helpFormData.append('image', help.imageFile);
            if (help.id) {
              if (help.description.trim()) {
                await topupService.adminUpdateFieldHelp(help.id, helpFormData);
              }
            } else if (help.description.trim()) {
              await topupService.adminAddFieldHelp(helpFormData);
            }
          }
        } else {
          if (!topup) continue;
          const autoKey =
            field.title
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9\u0600-\u06ff]+/g, '-')
              .replace(/^-+|-+$/g, '') || `field-${Date.now()}`;
          const result = await topupService.adminAddField({
            ...payload,
            key: autoKey,
            game: topup.id,
          } as Parameters<typeof topupService.adminAddField>[0]);
          const created = Array.isArray(result) ? result[0] : result;
          if (created?.id) {
            setFields((prev) =>
              prev.map((fi) =>
                fi.title === field.title && !fi.id ? { ...fi, id: created.id } : fi
              )
            );
            for (const help of field.helps ?? []) {
              if (!help.description.trim()) continue;
              const helpFormData = new FormData();
              helpFormData.append('description', help.description);
              helpFormData.append('field', String(created.id));
              if (help.imageFile) helpFormData.append('image', help.imageFile);
              await topupService.adminAddFieldHelp(helpFormData);
            }
          }
        }
      }
      toast.success('Fields saved successfully.');
      await authService.clearCache();
      loadData(); // Re-fetch to sync from server
    } catch {
      toast.error('Failed to save fields.');
    } finally {
      setSavingFields(false);
    }
  };

  const confirmDeleteField = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === 'field') {
        await topupService.adminDeleteField(deleteTarget.id);
        setFields((prev) => prev.filter((f) => f.id !== deleteTarget.id));
        toast.success('Field deleted.');
      } else {
        await topupService.adminDeletePackage(deleteTarget.id);
        setPackages((prev) => prev.filter((p) => p.id !== deleteTarget.id));
        toast.success('Package deleted.');
      }
    } catch {
      toast.error(`Failed to delete ${deleteTarget.type}.`);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  // ── Package helpers ───────────────────────────────────────────────
  const addPackage = () => setPackages((prev) => [...prev, defaultPackage()]);

  const updatePackage = (i: number, key: keyof PackageForm, value: unknown) => {
    setPackages((prev) => prev.map((p, idx) => (idx === i ? { ...p, [key]: value } : p)));
  };

  const handleSavePackages = async () => {
    const newErrors: Record<number, Record<string, string>> = {};
    packages.forEach((p, i) => {
      const e: Record<string, string> = {};
      if (!p.name.trim()) e.name = 'Name is required.';
      if (!p.amount.trim()) e.amount = 'Amount is required.';
      if (!p.price || parseFloat(p.price) <= 0) e.price = 'Price must be greater than 0.';
      if (p.stock_mode === 'manual' && !p.manual_fulfillment_time)
        e.manual_fulfillment_time = 'Fulfillment time is required for manual mode.';
      if (p.stock_mode === 'automatic' && (!p.codes || !p.codes.trim()) && !p.id)
        e.codes = 'At least one fulfillment code is required for new automatic packages.';
      if (Object.keys(e).length) newErrors[i] = e;
    });
    if (Object.keys(newErrors).length > 0) {
      setPkgErrors(newErrors);
      toast.error('Please fix package errors before saving.');
      return;
    }
    setPkgErrors({});
    setSavingPackages(true);
    try {
      const pkgCodesTasks: { codes: string; package_id: string }[] = [];

      for (const pkg of packages) {
        const formData = new FormData();
        formData.append('name', pkg.name);
        formData.append('amount', pkg.amount);
        formData.append('price', pkg.price);
        formData.append('is_active', String(pkg.is_active));
        formData.append('is_popular', String(pkg.is_popular));
        formData.append('order', String(pkg.order));
        formData.append('stock_mode', pkg.stock_mode);
        if (pkg.stock_mode === 'manual' && pkg.manual_fulfillment_time) {
          formData.append('manual_fulfillment_time', pkg.manual_fulfillment_time);
        }
        if (!topup) continue;
        formData.append('game', String(topup.id));

        let currentPackageId: number | undefined;

        if (pkg.id) {
          await topupService.adminUpdatePackage(pkg.id, formData);
          currentPackageId = pkg.id;
        } else {
          const result = await topupService.adminAddPackage(formData);
          if (result?.id) {
            currentPackageId = result.id;
            setPackages((prev) =>
              prev.map((pi) => (pi.name === pkg.name && !pi.id ? { ...pi, id: result.id } : pi))
            );
          }
        }

        if (pkg.stock_mode === 'automatic' && pkg.codes.trim() && currentPackageId) {
          pkgCodesTasks.push({ codes: pkg.codes, package_id: String(currentPackageId) });
        }
      }

      if (pkgCodesTasks.length > 0) {
        try {
          await Promise.all(
            pkgCodesTasks.map((payload) => codeService.adminAddUpdateDeleteCodes(slug, payload))
          );
        } catch (e) {
          console.error('Failed to attach codes', e);
          toast.error('Packages updated but failed to attach some fulfillment codes.');
        }
      }
      toast.success('Packages saved successfully.');
      await authService.clearCache();
      loadData(); // Re-fetch to show newly saved packages
    } catch {
      toast.error('Failed to save packages.');
    } finally {
      setSavingPackages(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (error || !topup) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-destructive">{error ?? 'Top-up not found.'}</p>
        <Link href="/dashboard/topups">
          <Button variant="outline" className="border-border">
            ← Back to Top-Ups
          </Button>
        </Link>
      </div>
    );
  }

  const tabCls =
    'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm px-5';

  return (
    <div className="space-y-8">
      <EditTopupHeader title={topup.product?.name ?? `TopUp #${topup.id}`} />

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="bg-muted p-1 border border-border inline-flex mb-6">
          <TabsTrigger value="info" className={tabCls}>
            Game Info
          </TabsTrigger>
          <TabsTrigger value="fields" className={tabCls}>
            Player Fields{' '}
            <Badge className="ml-2 bg-muted-foreground/20 text-muted-foreground border-none text-xs">
              {fields.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="packages" className={tabCls}>
            Packages{' '}
            <Badge className="ml-2 bg-muted-foreground/20 text-muted-foreground border-none text-xs">
              {packages.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="m-0 focus-visible:outline-none">
          <GameInfoTab
            gameName={gameName}
            setGameName={setGameName}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            categories={categories}
            region={region}
            setRegion={setRegion}
            shortDescription={shortDescription}
            setShortDescription={setShortDescription}
            imageFile={imageFile}
            setImageFile={setImageFile}
            currentLogo={currentLogo}
            isActive={isActive}
            setIsActive={setIsActive}
            isAvailable={isAvailable}
            setIsAvailable={setIsAvailable}
            isFeatured={isFeatured}
            setIsFeatured={setIsFeatured}
            gameInfoErrors={gameInfoErrors}
            setGameInfoErrors={setGameInfoErrors}
            savingGameInfo={savingGameInfo}
            handleSaveGameInfo={handleSaveGameInfo}
          />
        </TabsContent>

        <TabsContent value="fields" className="m-0 focus-visible:outline-none">
          <FieldsTab
            fields={fields}
            addField={addField}
            updateField={updateField}
            removeFieldLocally={removeFieldLocally}
            handleDeleteHelp={handleDeleteHelp}
            handleSaveFields={handleSaveFields}
            savingFields={savingFields}
            setDeleteTarget={setDeleteTarget}
            fieldErrors={fieldErrors}
            setFieldErrors={setFieldErrors}
          />
        </TabsContent>

        <TabsContent value="packages" className="m-0 focus-visible:outline-none">
          <PackagesTab
            packages={packages}
            addPackage={addPackage}
            updatePackage={updatePackage}
            handleSavePackages={handleSavePackages}
            savingPackages={savingPackages}
            setDeleteTarget={setDeleteTarget}
            pkgErrors={pkgErrors}
            setPkgErrors={setPkgErrors}
          />
        </TabsContent>
      </Tabs>

      <DeleteConfirmDialog
        deleteTarget={deleteTarget}
        setDeleteTarget={setDeleteTarget}
        deleting={deleting}
        onConfirm={confirmDeleteField}
      />
    </div>
  );
}
