'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { dashboardService } from '@/services/dashboard.service';
import { catalogService } from '@/services/catalog.service';
import type { ProductCategory, ProductTag } from '@/types/catalog';
import { toast } from 'sonner';
import { authService } from '@/services/auth.service';

import type { StockMode, AttributeRow, ImageState } from '@/components/admin/products/types';
import { ProductBasicInfo } from '@/components/admin/products/ProductBasicInfo';
import { ProductImages } from '@/components/admin/products/ProductImages';
import { ProductTags } from '@/components/admin/products/ProductTags';
import { ProductAttributes } from '@/components/admin/products/ProductAttributes';
import { ProductCodes } from '@/components/admin/products/ProductCodes';

export default function AdminProductCreatePage() {
  const router = useRouter();
  const imagesRef = useRef<ImageState[]>([]);

  // Basic fields
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

  // Images
  const [images, setImages] = useState<ImageState[]>([]);

  // Attributes
  const [attributes, setAttributes] = useState<AttributeRow[]>([]);

  // Codes (non-topup)
  const [codesText, setCodesText] = useState('');

  // Categories & Tags
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [tags, setTags] = useState<ProductTag[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [addingTag, setAddingTag] = useState(false);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (field: string) =>
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });

  useEffect(() => {
    Promise.all([
      catalogService.adminCategoriesList().catch(() => []),
      catalogService.adminTagsList().catch(() => []),
    ]).then(([catData, tagData]) => {
      const catList: ProductCategory[] = (
        Array.isArray(catData) ? catData : (catData?.results ?? [])
      ).filter((category: ProductCategory) => !category.name.startsWith('Topup'));
      const tagList: ProductTag[] = Array.isArray(tagData) ? tagData : (tagData?.results ?? []);
      setCategories(catList);
      setTags(tagList);
    });
  }, []);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((img) => {
        if (img.file && img.url.startsWith('blob:')) {
          URL.revokeObjectURL(img.url);
        }
      });
    };
  }, []);

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const acceptedFiles = files.filter((file) => file.type.startsWith('image/'));
    const rejectedCount = files.length - acceptedFiles.length;
    if (rejectedCount > 0) {
      setErrors((prev) => ({ ...prev, images: 'Only image files are allowed.' }));
      toast.error('Some selected files are not valid images.');
    }
    if (acceptedFiles.length === 0) {
      e.target.value = '';
      return;
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next.images;
      return next;
    });
    setImages((prev) => [
      ...prev,
      ...acceptedFiles.map((file, i) => ({
        file,
        url: URL.createObjectURL(file),
        isMain: prev.length === 0 && i === 0,
      })),
    ]);
    e.target.value = '';
  };

  const setMainImage = (index: number) => {
    setImages((prev) => prev.map((img, i) => ({ ...img, isMain: i === index })));
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const removed = prev[index];
      if (removed?.file && removed.url.startsWith('blob:')) {
        URL.revokeObjectURL(removed.url);
      }
      const next = prev.filter((_, i) => i !== index);
      if (next.length > 0 && !next.some((img) => img.isMain)) {
        next[0].isMain = true;
      }
      return next;
    });
  };

  const addAttribute = () => setAttributes((prev) => [...prev, { name: '', value: '' }]);
  const removeAttribute = (i: number) =>
    setAttributes((prev) => prev.filter((_, idx) => idx !== i));
  const updateAttribute = (i: number, field: keyof AttributeRow, value: string) => {
    setAttributes((prev) => prev.map((a, idx) => (idx === i ? { ...a, [field]: value } : a)));
  };

  const toggleTag = (id: number) => {
    setSelectedTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  const handleAddNewTag = async () => {
    const trimmed = newTagInput.trim();
    if (!trimmed) return;
    const existing = tags.find((t) => t.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      setSelectedTags((prev) => (prev.includes(existing.id) ? prev : [...prev, existing.id]));
      setNewTagInput('');
      return;
    }
    setAddingTag(true);
    try {
      const created = await catalogService.adminAddTag({ name: trimmed });
      const newTag: ProductTag = created;
      setTags((prev) => [...prev, newTag]);
      setSelectedTags((prev) => [...prev, newTag.id]);
      setNewTagInput('');
    } catch {
      toast.error('Failed to add tag.');
    } finally {
      setAddingTag(false);
    }
  };

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
    if (stockMode === 'automatic' && !codesText.trim())
      newErrors.codes = 'At least one fulfillment code is required for automatic delivery.';
    if (images.length === 0) newErrors.images = 'Please upload at least one product image.';

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
      if (stockMode === 'manual' && manualFulfillmentTime)
        formData.append('manual_fulfillment_time', manualFulfillmentTime);
      if (shortDescription) formData.append('short_description', shortDescription);
      if (description) formData.append('description', description);
      formData.append('is_active', isActive ? 'true' : 'false');
      formData.append('is_available', isAvailable ? 'true' : 'false');
      formData.append('is_popular', isPopular ? 'true' : 'false');
      formData.append('is_featured', isFeatured ? 'true' : 'false');

      if (selectedCategory) formData.append('category', selectedCategory);
      selectedTags.forEach((id) => formData.append('tags', String(id)));

      images.forEach((img, i) => {
        if (img.file) formData.append(`images[${i}][image]`, img.file);
        formData.append(`images[${i}][is_main]`, String(img.isMain));
      });

      attributes.forEach((attr, i) => {
        formData.append(`attributes[${i}][name]`, attr.name);
        formData.append(`attributes[${i}][value]`, attr.value);
      });

      if (codesText.trim()) {
        const codeArray = codesText
          .split('\n')
          .map((c) => c.trim())
          .filter(Boolean);
        formData.append('codes', JSON.stringify(codeArray));
      }

      await dashboardService.adminCreateProductFull(formData);
      toast.success('Product created successfully!');
      await authService.clearCache();
      images.forEach((img) => {
        if (img.file && img.url.startsWith('blob:')) {
          URL.revokeObjectURL(img.url);
        }
      });
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
        toast.error(message ?? 'Failed to create product. Please check all fields.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 w-full">
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Create Product</h1>
          <p className="text-muted-foreground mt-1">Add a new digital product to the catalog.</p>
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
          categories={categories}
          errors={errors}
          clearError={clearError}
        />

        <ProductImages
          images={images}
          handleImageAdd={handleImageAdd}
          setMainImage={setMainImage}
          removeImage={removeImage}
          imageError={errors.images}
        />

        <ProductTags
          tags={tags}
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
          />
        )}

        <div className="flex gap-3 justify-end pb-8">
          <Link href="/dashboard/products">
            <Button type="button" variant="outline" className="border-border" disabled={submitting}>
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            className="bg-primary hover:bg-primary-hover text-primary-foreground min-w-32"
            disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              'Create Product'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
