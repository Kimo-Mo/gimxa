'use client';

import { useEffect, useState, useRef, startTransition } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { topupService } from '@/services/topup.service';
import type { AdminTopupGameField, AdminTopupPackage } from '@/types/admin/topups';
import { toast } from 'sonner';

import { EditTopupHeader } from '@/components/admin/topups/EditTopupHeader';
import { GameInfoTab } from '@/components/admin/topups/GameInfoTab';
import { FieldsTab } from '@/components/admin/topups/FieldsTab';
import { PackagesTab } from '@/components/admin/topups/PackagesTab';
import { DeleteConfirmDialog } from '@/components/admin/topups/DeleteConfirmDialog';
import type { FieldForm, PackageForm, FieldType, StockMode } from '@/components/admin/topups/types';
import type { AttributeRow, ImageState } from '@/components/admin/products/types';
import { ProductAttributes } from '@/components/admin/products/ProductAttributes';
import { useTagsQuery } from '@/hooks/admin/useTagsQuery';
import { useCreateTagMutation, useDeleteTagMutation } from '@/hooks/admin/useTagMutations';
import { ProductTags } from '@/components/admin/products/ProductTags';
import type { ProductTag } from '@/types/catalog';

import { useTopupDetailQuery } from '@/hooks/admin/useTopupDetailQuery';
import {
  useUpdateTopupGameInfoMutation,
  useSaveTopupFieldsMutation,
  useSaveTopupPackagesMutation,
  useDeleteTopupItemMutation,
} from '@/hooks/admin/useTopupMutations';
import { useRegionsQuery } from '@/hooks/admin/useRegionsQuery';
import { useTypesQuery } from '@/hooks/admin/useTypesQuery';
import { usePlatformsQuery } from '@/hooks/admin/usePlatformsQuery';

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
  price_before_offer: '',
  offer_value: '',
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
  const [region, setRegion] = useState('');
  const [type, setType] = useState('');
  const [platform, setPlatform] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [help, setHelp] = useState('');
  const [gameInfoErrors, setGameInfoErrors] = useState<Record<string, string>>({});
  const [isActive, setIsActive] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isPopular, setIsPopular] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isProductLoaded, setIsProductLoaded] = useState(false);

  // Images state
  const [images, setImages] = useState<ImageState[]>([]);
  const [deletedImages, setDeletedImages] = useState<number[]>([]);
  const imagesRef = useRef<ImageState[]>([]);

  useEffect(() => { imagesRef.current = images; }, [images]);
  useEffect(() => {
    return () => {
      imagesRef.current.forEach((img) => {
        if (img.file && img.url.startsWith('blob:')) URL.revokeObjectURL(img.url);
      });
    };
  }, []);

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const newImgs = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      isMain: false,
    }));
    setImages((prev) => {
      const combined = [...prev, ...newImgs];
      if (combined.length > 0 && !combined.some((img) => img.isMain)) combined[0].isMain = true;
      return combined;
    });
    e.target.value = '';
  };

  const setMainImage = (index: number) => {
    setImages((prev) => prev.map((img, i) => ({ ...img, isMain: i === index })));
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const removedImg = prev[index];
      if (removedImg.id) {
        setDeletedImages((d) => [...d, removedImg.id as number]);
      } else if (removedImg.url.startsWith('blob:')) {
        URL.revokeObjectURL(removedImg.url);
      }
      const next = prev.filter((_, i) => i !== index);
      if (next.length > 0 && !next.some((img) => img.isMain)) next[0].isMain = true;
      return next;
    });
  };

  // Fields state
  const [fields, setFields] = useState<FieldForm[]>([]);

  // Packages state
  const [packages, setPackages] = useState<PackageForm[]>([]);

  // Attributes state
  const [attributes, setAttributes] = useState<AttributeRow[]>([]);
  const [deletedAttributes, setDeletedAttributes] = useState<number[]>([]);

  // Tags state
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

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
  const regionsQuery = useRegionsQuery();
  const typesQuery = useTypesQuery();
  const platformsQuery = usePlatformsQuery();

  const topupId = topupQuery.data?.id || 0;

  const gameInfoMutation = useUpdateTopupGameInfoMutation(slug);
  const fieldsMutation = useSaveTopupFieldsMutation({ slug, topupId });
  const packagesMutation = useSaveTopupPackagesMutation({ slug, topupId });
  const deleteItemMutation = useDeleteTopupItemMutation(slug);
  const categories = categoriesQuery.data ?? [];
  const regions = regionsQuery.data ?? [];
  const types = typesQuery.data ?? [];
  const platforms = platformsQuery.data ?? [];

  const tagsQuery = useTagsQuery();
  const createTagMutation = useCreateTagMutation();
  const deleteTagMutation = useDeleteTagMutation();
  const tags = tagsQuery.data ?? [];

  const handleAddNewTag = () => {
    if (!newTagInput.trim()) return;
    createTagMutation.mutate(newTagInput.trim(), {
      onSuccess: (data) => {
        setNewTagInput('');
        setSelectedTags((prev) => [...prev, data.id]);
        toast.success(`Tag "${data.name}" created.`);
      },
      onError: () => toast.error('Failed to create tag.'),
    });
  };

  const toggleTag = (id: number) => {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    if (!topupQuery.data || topupHydrated.current) return;
    topupHydrated.current = true;

    const data = topupQuery.data;
    const productData = data.product as
      | (typeof data.product & {
        region?: { id: number } | string;
        type?: { id: number } | string;
        platform?: { id: number } | string;
        short_description?: string;
        description?: string;
        help?: string;
        price?: string;
        price_before_offer?: string;
        offer_value?: string;
        images?: { id?: number; image: string; is_main: boolean }[];
        attributes?: { id: number; name: string; value: string }[];
        tags?: { id: number; name: string }[];
        is_popular?: boolean;
      })
      | undefined;

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

    startTransition(() => {
      if (productData) {
        setGameName(productData.name || '');

        // Region: object or string id
        const regionVal = productData.region;
        setRegion(
          typeof regionVal === 'object' && regionVal !== null
            ? String((regionVal as { id: number }).id)
            : typeof regionVal === 'string'
              ? regionVal
              : ''
        );

        // Type: object or string id
        const typeVal = productData.type;
        setType(
          typeof typeVal === 'object' && typeVal !== null
            ? String((typeVal as { id: number }).id)
            : typeof typeVal === 'string'
              ? typeVal
              : ''
        );

        // Platform: object or string id
        const platformVal = productData.platform;
        setPlatform(
          typeof platformVal === 'object' && platformVal !== null
            ? String((platformVal as { id: number }).id)
            : typeof platformVal === 'string'
              ? platformVal
              : ''
        );

        setShortDescription(productData.short_description || '');
        setDescription(productData.description || '');
        setHelp(productData.help || '');
        setIsActive(data.is_active ?? true);
        setIsAvailable(productData.is_available ?? true);
        setIsPopular(productData.is_popular ?? false);
        setIsFeatured(productData.is_featured ?? false);
        setSelectedCategory(
          productData.categories?.length ? String(productData.categories[0].id) : ''
        );

        // Images
        const rawImages = productData.images ?? [];
        const nextImages: ImageState[] = rawImages.length
          ? rawImages.map((img) => ({ id: img.id, url: img.image, isMain: img.is_main }))
          : data.logo
            ? [{ url: data.logo, isMain: true }]
            : [];
        setImages(nextImages);
      }
      setFields(nextFields);
      setAttributes(productData?.attributes?.map((a) => ({ id: a.id, name: a.name, value: a.value })) ?? []);
      setSelectedTags(productData?.tags?.map((t) => t.id) ?? []);
      setTimeout(() => setIsProductLoaded(true), 0);
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
      price: p.price ? String(Number(p.price).toFixed(2)) : '',
      price_before_offer: p.price_before_offer ? String(Number(p.price_before_offer).toFixed(2)) : '',
      offer_value: p.offer_value ? String(Number(p.offer_value).toFixed(2)) : '',
      is_active: p.is_active,
      is_popular: p.is_popular,
      order: p.order,
      stock_mode: (p.stock_mode as StockMode) ?? 'manual',
      manual_fulfillment_time: p.manual_fulfillment_time ? String(p.manual_fulfillment_time) : '',
      codes: '',
      imageFile: null,
      imageUrl: p.image ?? null,
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
    if (region) formData.append('region', region);
    if (type) formData.append('type', type);
    if (platform) formData.append('platform', platform);
    formData.append('category', selectedCategory);
    formData.append('short_description', shortDescription.trim());
    formData.append('description', description.trim());
    if (help) formData.append('help', help.trim());
    else formData.append('help', '');
    formData.append('product_type', 'topup');
    formData.append('is_available', String(isAvailable));
    formData.append('is_popular', String(isPopular));
    formData.append('is_featured', String(isFeatured));

    // Images
    images.forEach((img, i) => {
      if (img.id) formData.append(`images[${i}][id]`, String(img.id));
      if (img.file) {
        formData.append(`images[${i}][image]`, img.file);
        if (img.isMain) formData.append('logo', img.file);
      }
      formData.append(`images[${i}][is_main]`, String(img.isMain));
    });
    if (deletedImages.length > 0) {
      formData.append('deleted_images', JSON.stringify(deletedImages));
    }

    attributes.forEach((attr, i) => {
      if (attr.id) formData.append(`attributes[${i}][id]`, String(attr.id));
      formData.append(`attributes[${i}][name]`, attr.name);
      formData.append(`attributes[${i}][value]`, attr.value);
    });
    if (deletedAttributes.length > 0) {
      formData.append('deleted_attributes', JSON.stringify(deletedAttributes));
    }

    selectedTags.forEach((tagId) => {
      formData.append('tags', String(tagId));
    });

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

  // ── Attribute helpers ──────────────────────────────────────────────
  const addAttribute = () => setAttributes((prev) => [...prev, { name: '', value: '' }]);
  const removeAttribute = (i: number) => {
    setAttributes((prev) => {
      const removedAttr = prev[i];
      if (removedAttr.id) setDeletedAttributes((d) => [...d, removedAttr.id as number]);
      return prev.filter((_, idx) => idx !== i);
    });
  };
  const updateAttribute = (i: number, field: keyof AttributeRow, value: string) => {
    setAttributes((prev) => prev.map((a, idx) => (idx === i ? { ...a, [field]: value } : a)));
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
      if (!p.price_before_offer || parseFloat(p.price_before_offer) <= 0) e.price_before_offer = 'Price before offer must be greater than 0.';
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
    packagesMutation.mutate(packages, {
      onSuccess: () => {
        setPackages((prev) => prev.map((p) => ({ ...p, codes: '' })));
      },
    });
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
        <p className="text-destructive">Top up not found.</p>
        <Link href="/dashboard/topups">
          <Button variant="outline" className="border-border">
            ← Back to Top Up
          </Button>
        </Link>
      </div>
    );
  }

  const tabCls =
    'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm sm:px-5 flex-1 sm:flex-none';

  return (
    <div className="space-y-8">
      <EditTopupHeader title={topupQuery.data.product?.name ?? `TopUp #${topupQuery.data.id}`} />

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="bg-muted p-1 border border-border flex sm:inline-flex h-auto w-full sm:w-fit gap-1 mb-6">
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
            regions={regions}
            type={type}
            setType={setType}
            types={types}
            platform={platform}
            setPlatform={setPlatform}
            platforms={platforms}
            shortDescription={shortDescription}
            setShortDescription={setShortDescription}
            description={description}
            setDescription={setDescription}
            help={help}
            setHelp={setHelp}
            images={images}
            handleImageAdd={handleImageAdd}
            setMainImage={setMainImage}
            removeImage={removeImage}
            isEditMode={true}
            isActive={isActive}
            setIsActive={setIsActive}
            isAvailable={isAvailable}
            setIsAvailable={setIsAvailable}
            isPopular={isPopular}
            setIsPopular={setIsPopular}
            isFeatured={isFeatured}
            setIsFeatured={setIsFeatured}
            gameInfoErrors={gameInfoErrors}
            setGameInfoErrors={setGameInfoErrors}
            savingGameInfo={gameInfoMutation.isPending}
            handleSaveGameInfo={handleSaveGameInfo}
            hideSaveButton={true}
            isLoaded={isProductLoaded}
          />
          <div className="mt-6 space-y-6">
            <ProductAttributes
              attributes={attributes}
              addAttribute={addAttribute}
              updateAttribute={updateAttribute}
              removeAttribute={removeAttribute}
            />
            <ProductTags
              tags={tags}
              selectedTags={selectedTags}
              newTagInput={newTagInput}
              setNewTagInput={setNewTagInput}
              addingTag={createTagMutation.isPending}
              handleAddNewTag={handleAddNewTag}
              toggleTag={toggleTag}
              onDeleteTag={(tag) =>
                deleteTagMutation.mutate(tag.slug, {
                  onSuccess: () => setSelectedTags((prev) => prev.filter((t) => t !== tag.id)),
                })
              }
              deletingTagId={
                deleteTagMutation.isPending && typeof deleteTagMutation.variables === 'string'
                  ? tags.find((t) => t.slug === deleteTagMutation.variables)?.id ?? null
                  : null
              }
            />
          </div>
          {/* Unified Save button */}
          <div className="flex justify-end pt-4 mt-2 border-t border-border">
            <Button
              type="button"
              onClick={handleSaveGameInfo}
              disabled={gameInfoMutation.isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              {gameInfoMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {gameInfoMutation.isPending ? 'Saving…' : 'Save Info'}
            </Button>
          </div>
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
            slug={slug}
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
