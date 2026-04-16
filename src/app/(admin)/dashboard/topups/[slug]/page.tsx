'use client';

import { useEffect, useState, useRef, startTransition } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { topupService } from '@/services/topup.service';
import type { AdminTopupGameField, AdminTopupPackage } from '@/types/admin/topups';
import type { ProductCategory } from '@/types/catalog';
import { toast } from 'sonner';

import { EditTopupHeader } from '@/components/admin/topups/EditTopupHeader';
import { GameInfoTab } from '@/components/admin/topups/GameInfoTab';
import { FieldsTab } from '@/components/admin/topups/FieldsTab';
import { PackagesTab } from '@/components/admin/topups/PackagesTab';
import { DeleteConfirmDialog } from '@/components/admin/topups/DeleteConfirmDialog';
import type { FieldForm, PackageForm, FieldType, StockMode } from '@/components/admin/topups/types';

import { useTopupDetailQuery } from '@/hooks/admin/useTopupDetailQuery';
import {
  useUpdateTopupGameInfoMutation,
  useSaveTopupFieldsMutation,
  useSaveTopupPackagesMutation,
  useDeleteTopupItemMutation,
} from '@/hooks/admin/useTopupMutations';

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
  stock_mode: 'manual',
  manual_fulfillment_time: '',
  codes: '',
});

export default function AdminTopupDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  // Game Info state
  const [gameName, setGameName] = useState('');
  const [region, setRegion] = useState('global');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [shortDescription, setShortDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);
  const [gameInfoErrors, setGameInfoErrors] = useState<Record<string, string>>({});
  const [isActive, setIsActive] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  // Fields state
  const [fields, setFields] = useState<FieldForm[]>([]);

  // Packages state
  const [packages, setPackages] = useState<PackageForm[]>([]);

  // Hydration refs
  const topupHydrated = useRef(false);
  const packagesHydrated = useRef(false);

  // Delete target
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'field' | 'package';
    id: number;
  } | null>(null);

  // Inline validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<number, Record<string, string>>>({});
  const [pkgErrors, setPkgErrors] = useState<Record<number, Record<string, string>>>({});

  const { topupQuery, packagesQuery, categoriesQuery } = useTopupDetailQuery(slug);

  const topupId = topupQuery.data?.id || 0;

  const gameInfoMutation = useUpdateTopupGameInfoMutation(slug);
  const fieldsMutation = useSaveTopupFieldsMutation({ slug, topupId });
  const packagesMutation = useSaveTopupPackagesMutation({ slug, topupId });
  const deleteItemMutation = useDeleteTopupItemMutation(slug);

  const categories = (categoriesQuery.data ?? []).filter((c: ProductCategory) => c.name.startsWith('Topup'));

  useEffect(() => {
    if (!topupQuery.data || topupHydrated.current) return;
    topupHydrated.current = true;

    const data = topupQuery.data;
    const productData = data.product as
      | (typeof data.product & {
          region?: string;
          short_description?: string;
          images?: { image: string; is_main: boolean }[];
        })
      | undefined;

    // Derive all values first, then batch into a single flushSync-free update
    const nextFields: FieldForm[] = (data.fields ?? []).map((f: AdminTopupGameField) => ({
      id: f.id,
      title: f.title,
      placeholder: f.placeholder || '',
      key: f.key,
      field_type: f.field_type as FieldType,
      is_required: f.is_required,
      order: f.order,
      min_input_length: f.min_input_length,
      helps: (f.helps ?? []).map((h) => ({
        id: h.id,
        description: h.description,
        imageFile: null,
        imageUrl: h.image ?? null,
      })),
    }));

    // Wrap all setState calls in startTransition to avoid cascading render warning
    startTransition(() => {
      if (productData) {
        setGameName(productData.name || '');
        setRegion(productData.region || 'global');
        setShortDescription(productData.short_description || '');
        setIsActive(data.is_active ?? true);
        setIsAvailable(productData.is_available ?? true);
        setIsFeatured(productData.is_featured ?? false);
        setSelectedCategory(
          productData.categories?.length ? String(productData.categories[0].id) : ''
        );

        const images = productData.images ?? [];
        const mainImg = images.find((img) => img.is_main) || images[0];
        setCurrentLogo(
          mainImg?.image ??
            (typeof productData.main_image === 'object' && productData.main_image !== null
              ? (productData.main_image.image ?? data.logo ?? null)
              : typeof productData.main_image === 'string'
                ? productData.main_image
                : (data.logo ?? null))
        );
      }
      setFields(nextFields);
    });
  }, [topupQuery.data]);

  useEffect(() => {
    if (!packagesQuery.data || packagesHydrated.current) return;
    packagesHydrated.current = true;

    type PackageResponse = AdminTopupPackage[] | { results: AdminTopupPackage[] };
    const res = packagesQuery.data as PackageResponse;
    const rawPkgs: AdminTopupPackage[] =
      'results' in res ? res.results : Array.isArray(res) ? res : [];

    const nextPackages: PackageForm[] = rawPkgs.map((p) => ({
      id: p.id,
      name: p.name,
      amount: p.amount,
      price: String(Number(p.price).toFixed(2)),
      is_active: p.is_active,
      is_popular: p.is_popular,
      order: p.order,
      stock_mode: (p.stock_mode as StockMode) ?? 'manual',
      manual_fulfillment_time: p.manual_fulfillment_time ? String(p.manual_fulfillment_time) : '',
      codes: '',
    }));

    startTransition(() => {
      setPackages(nextPackages);
    });
  }, [packagesQuery.data]);


  // ── Game Info helpers ─────────────────────────────────────────────
  const handleSaveGameInfo = () => {
    const errs: Record<string, string> = {};
    if (!gameName.trim()) errs.name = 'Game name is required.';
    if (!selectedCategory) errs.category = 'Category is required.';

    if (Object.keys(errs).length > 0) {
      setGameInfoErrors(errs);
      toast.error('Please fix game info errors.');
      return;
    }

    setGameInfoErrors({});

    const formData = new FormData();
    formData.append('name', gameName.trim());
    formData.append('region', region);
    formData.append('category', selectedCategory);
    formData.append('short_description', shortDescription.trim());
    formData.append('product_type', 'topup');
    formData.append('is_available', String(isAvailable));
    formData.append('is_featured', String(isFeatured));
    // is_active goes to topup level, not product level, handled by mutation
    if (imageFile) {
      formData.append('logo', imageFile);
      formData.append('images[0][image]', imageFile);
      formData.append('images[0][is_main]', 'true');
    }

    gameInfoMutation.mutate({ formData, isActive });
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

  const handleSaveFields = () => {
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
    fieldsMutation.mutate(fields);
  };

  // ── Package helpers ───────────────────────────────────────────────
  const addPackage = () => setPackages((prev) => [...prev, defaultPackage()]);

  const updatePackage = (i: number, key: keyof PackageForm, value: unknown) => {
    setPackages((prev) => prev.map((p, idx) => (idx === i ? { ...p, [key]: value } : p)));
  };

  const handleSavePackages = () => {
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
    packagesMutation.mutate(packages);
  };

  if (topupQuery.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (topupQuery.isError || !topupQuery.data) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-destructive">Top-up not found.</p>
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
      <EditTopupHeader title={topupQuery.data.product?.name ?? `TopUp #${topupQuery.data.id}`} />

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
            savingGameInfo={gameInfoMutation.isPending}
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
            savingFields={fieldsMutation.isPending}
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
            savingPackages={packagesMutation.isPending}
            setDeleteTarget={setDeleteTarget}
            pkgErrors={pkgErrors}
            setPkgErrors={setPkgErrors}
          />
        </TabsContent>
      </Tabs>

      <DeleteConfirmDialog
        deleteTarget={deleteTarget}
        setDeleteTarget={setDeleteTarget}
        deleting={deleteItemMutation.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteItemMutation.mutate(deleteTarget);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
