'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { dashboardService } from '@/services/dashboard.service';
import { catalogService } from '@/services/catalog.service';
import type { Product, ProductCategory, ProductTag } from '@/types/catalog';
import { toast } from 'sonner';
import { authService } from '@/services/auth.service';

import type { StockMode, AttributeRow, ImageState } from '@/components/admin/products/types';
import { ProductBasicInfo } from '@/components/admin/products/ProductBasicInfo';
import { ProductImages } from '@/components/admin/products/ProductImages';
import { ProductTags } from '@/components/admin/products/ProductTags';
import { ProductAttributes } from '@/components/admin/products/ProductAttributes';
import { ProductCodes } from '@/components/admin/products/ProductCodes';

export default function AdminProductEditPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string;

  // Loading states
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stockMode, setStockMode] = useState<StockMode>('automatic');
  const [manualFulfillmentTime, setManualFulfillmentTime] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isPopular, setIsPopular] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [region, setRegion] = useState('global');

  // Collections
  const [images, setImages] = useState<ImageState[]>([]);
  const [deletedImages, setDeletedImages] = useState<number[]>([]);

  const [attributes, setAttributes] = useState<AttributeRow[]>([]);
  const [deletedAttributes, setDeletedAttributes] = useState<number[]>([]);

  const [codesText, setCodesText] = useState('');

  // Categories & Tags
  const [allCategories, setAllCategories] = useState<ProductCategory[]>([]);
  const [allTags, setAllTags] = useState<ProductTag[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [addingTag, setAddingTag] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (field: string) =>
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });

  // Fetch initial option lists
  useEffect(() => {
    Promise.all([
      catalogService.adminCategoriesList().catch(() => []),
      catalogService.adminTagsList().catch(() => []),
    ]).then(([catData, tagData]) => {
      setAllCategories(
        Array.isArray(catData)
          ? catData
          : (catData?.results ?? []).filter(
              (category: ProductCategory) => !category.name.startsWith('Topup')
            )
      );
      setAllTags(Array.isArray(tagData) ? tagData : (tagData?.results ?? []));
    });
  }, []);

  // Fetch product data
  useEffect(() => {
    if (!slug) return;

    setInitialLoading(true);
    catalogService
      .adminGetProduct(slug)
      .then((data: Product) => {
        setName(data.name || '');
        setPrice(data.price ? String(data.price) : '');
        setStockMode((data.stock_mode as StockMode) || 'automatic');
        setManualFulfillmentTime(
          data.manual_fulfillment_time ? String(data.manual_fulfillment_time) : ''
        );
        setShortDescription(data.short_description || '');
        setDescription(data.description || '');
        setIsActive(data.is_active ?? true);
        setIsAvailable(data.is_available ?? true);
        setIsPopular(data.is_popular ?? false);
        setIsFeatured(data.is_featured ?? false);
        setRegion(data.region ?? 'global');

        // Images
        if (data.images && data.images.length > 0) {
          setImages(
            data.images.map((img) => ({
              id: img.id,
              url: img.image,
              isMain: img.is_main,
            }))
          );
        } else if (data.main_image && typeof data.main_image === 'object') {
          setImages([
            {
              id: (data.main_image).id,
              url: (data.main_image).image,
              isMain: (data.main_image).is_main,
            },
          ]);
        }

        // Attributes
        if (data.attributes) {
          setAttributes(
            data.attributes.map((attr) => ({
              id: attr.id,
              name: attr.name,
              value: attr.value,
            }))
          );
        }

        // Categories & Tags — take the first category as the selected one
        if (data.categories && data.categories.length > 0) {
          setSelectedCategory(String(data.categories[0].id));
        }
        if (data.tags) {
          setSelectedTags(data.tags.map((t) => t.id));
        }
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load product. It may not exist.');
      })
      .finally(() => {
        setInitialLoading(false);
      });
  }, [slug]);

  // Image Handlers
  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const newImages = files.map((file) => ({
      file,
      url: URL.createObjectURL(file), // for preview
      isMain: false, // default to false
    }));

    setImages((prev) => {
      const combined = [...prev, ...newImages];
      // If we didn't have any images at all, make the first one main
      if (combined.length > 0 && !combined.some((img) => img.isMain)) {
        combined[0].isMain = true;
      }
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
      }
      const next = prev.filter((_, i) => i !== index);
      if (next.length > 0 && !next.some((img) => img.isMain)) {
        next[0].isMain = true;
      }
      return next;
    });
  };

  // Attribute Handlers
  const addAttribute = () => setAttributes((prev) => [...prev, { name: '', value: '' }]);
  const removeAttribute = (i: number) => {
    setAttributes((prev) => {
      const removedAttr = prev[i];
      if (removedAttr.id) {
        setDeletedAttributes((d) => [...d, removedAttr.id as number]);
      }
      return prev.filter((_, idx) => idx !== i);
    });
  };
  const updateAttribute = (i: number, field: keyof AttributeRow, value: string) => {
    setAttributes((prev) => prev.map((a, idx) => (idx === i ? { ...a, [field]: value } : a)));
  };

  // Tag Toggles
  const toggleTag = (id: number) => {
    setSelectedTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  const handleAddNewTag = async () => {
    const trimmed = newTagInput.trim();
    if (!trimmed) return;
    const existing = allTags.find((t) => t.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      setSelectedTags((prev) => (prev.includes(existing.id) ? prev : [...prev, existing.id]));
      setNewTagInput('');
      return;
    }
    setAddingTag(true);
    try {
      const created = await catalogService.adminAddTag({ name: trimmed });
      const newTag: ProductTag = created;
      setAllTags((prev) => [...prev, newTag]);
      setSelectedTags((prev) => [...prev, newTag.id]);
      setNewTagInput('');
    } catch {
      toast.error('Failed to add tag.');
    } finally {
      setAddingTag(false);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Product name is required.';
    if (!price || parseFloat(price) <= 0)
      newErrors.price = 'Price is required and must be greater than 0.';
    if (!selectedCategory) newErrors.category = 'Category is required.';
    if (!stockMode) newErrors.stockMode = 'Stock mode is required.';
    if (stockMode === 'manual' && !manualFulfillmentTime)
      newErrors.manualFulfillmentTime = 'Fulfillment time is required for manual mode.';
    if (stockMode === 'manual' && manualFulfillmentTime && parseInt(manualFulfillmentTime) <= 0)
      newErrors.manualFulfillmentTime = 'Fulfillment time must be greater than 0.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fix the errors before submitting.');
      return;
    }
    setErrors({});

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('product_type', 'digital');
      formData.append('stock_mode', stockMode);
      formData.append('region', region);
      if (price) formData.append('price', price);

      if (stockMode === 'manual' && manualFulfillmentTime) {
        formData.append('manual_fulfillment_time', manualFulfillmentTime);
      } else if (stockMode === 'automatic') {
        formData.append('manual_fulfillment_time', '0');
      }

      formData.append('short_description', shortDescription);
      formData.append('description', description);
      formData.append('is_active', isActive ? 'true' : 'false');
      formData.append('is_available', isAvailable ? 'true' : 'false');
      formData.append('is_popular', isPopular ? 'true' : 'false');
      formData.append('is_featured', isFeatured ? 'true' : 'false');

      // Backend field name is 'category' (M2M source alias), NOT 'categories'
      if (selectedCategory) formData.append('category', selectedCategory);
      selectedTags.forEach((id) => formData.append('tags', String(id)));

      // Images (indexed)
      images.forEach((img, i) => {
        if (img.id) formData.append(`images[${i}][id]`, String(img.id));
        if (img.file) formData.append(`images[${i}][image]`, img.file);
        formData.append(`images[${i}][is_main]`, String(img.isMain));
      });
      if (deletedImages.length > 0) {
        formData.append('deleted_images', JSON.stringify(deletedImages));
      }

      // Attributes (indexed)
      attributes.forEach((attr, i) => {
        if (attr.id) formData.append(`attributes[${i}][id]`, String(attr.id));
        formData.append(`attributes[${i}][name]`, attr.name);
        formData.append(`attributes[${i}][value]`, attr.value);
      });
      if (deletedAttributes.length > 0) {
        formData.append('deleted_attributes', JSON.stringify(deletedAttributes));
      }

      // New Codes (for non-topup products)
      if (codesText.trim()) {
        const codeArray = codesText
          .split('\n')
          .map((c) => c.trim())
          .filter(Boolean);
        if (codeArray.length > 0) {
          formData.append('codes', JSON.stringify(codeArray));
        }
      }

      await dashboardService.adminUpdateProductFull(slug, formData);
      toast.success('Product updated successfully!');
      await authService.clearCache();
      router.push('/dashboard/products');
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: Record<string, unknown> } };
      const raw = axErr?.response?.data as Record<string, unknown> | undefined;
      const errors = raw?.errors as Record<string, unknown> | undefined;
      const message = raw?.message as string | undefined;
      if (errors && typeof errors === 'object') {
        const fieldErrors = Object.entries(errors)
          .map(([field, msgs]) => {
            const msgStr = Array.isArray(msgs) ? msgs.join(', ') : String(msgs);
            return `${field}: ${msgStr}`;
          })
          .slice(0, 4)
          .join('\n');
        toast.error(`Validation failed:\n${fieldErrors}`);
      } else {
        toast.error(message ?? 'Failed to update product.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Card>
          <CardContent className="h-100 flex items-center justify-center text-muted-foreground">
            Loading product details...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 space-y-4 max-w-4xl mx-auto">
        <p className="text-destructive font-medium">{error}</p>
        <Link href="/dashboard/products">
          <Button variant="outline">← Back to Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 w-full">
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/products">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Edit Product</h1>
            <p className="text-muted-foreground mt-1 text-sm font-mono">{slug}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <ProductBasicInfo
          name={name}
          setName={setName}
          price={price}
          setPrice={setPrice}
          stockMode={stockMode}
          setStockMode={setStockMode}
          manualFulfillmentTime={manualFulfillmentTime}
          setManualFulfillmentTime={setManualFulfillmentTime}
          shortDescription={shortDescription}
          setShortDescription={setShortDescription}
          description={description}
          setDescription={setDescription}
          isActive={isActive}
          setIsActive={setIsActive}
          isAvailable={isAvailable}
          setIsAvailable={setIsAvailable}
          isPopular={isPopular}
          setIsPopular={setIsPopular}
          isFeatured={isFeatured}
          setIsFeatured={setIsFeatured}
          region={region}
          setRegion={setRegion}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={allCategories}
          errors={errors}
          clearError={clearError}
        />

        <ProductImages
          images={images}
          handleImageAdd={handleImageAdd}
          setMainImage={setMainImage}
          removeImage={removeImage}
          isEditMode
        />

        <ProductTags
          tags={allTags}
          selectedTags={selectedTags}
          newTagInput={newTagInput}
          setNewTagInput={setNewTagInput}
          addingTag={addingTag}
          handleAddNewTag={handleAddNewTag}
          toggleTag={toggleTag}
        />

        <ProductAttributes
          attributes={attributes}
          addAttribute={addAttribute}
          updateAttribute={updateAttribute}
          removeAttribute={removeAttribute}
        />

        {stockMode === 'automatic' && (
          <ProductCodes
            codesText={codesText}
            setCodesText={setCodesText}
            errors={errors}
            clearError={clearError}
            isEditMode
          />
        )}

        <div className="flex gap-3 justify-end pb-8">
          <Link href="/dashboard/products">
            <Button type="button" variant="outline" className="border-border">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-primary hover:bg-primary-hover text-primary-foreground min-w-32 gap-2">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
