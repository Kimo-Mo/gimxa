'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Zap } from 'lucide-react';
import { topupService } from '@/services/topup.service';
import { dashboardService } from '@/services/dashboard.service';
import { catalogService } from '@/services/catalog.service';
import { codeService } from '@/services/code.service';
import { toast } from 'sonner';
import type { ProductCategory } from '@/types/catalog';
import { authService } from '@/services/auth.service';

import { GameInfoTab } from '@/components/admin/topups/GameInfoTab';
import { FieldsTab } from '@/components/admin/topups/FieldsTab';
import { PackagesTab } from '@/components/admin/topups/PackagesTab';
import type { FieldForm, PackageForm } from '@/components/admin/topups/types';

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

export default function AdminTopupCreatePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Product info
  const [gameName, setGameName] = useState('');
  const [region, setRegion] = useState('global');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [shortDescription, setShortDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [isActive, setIsActive] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

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

  // Fields & Packages
  const [fields, setFields] = useState<FieldForm[]>([defaultField()]);
  const [packages, setPackages] = useState<PackageForm[]>([defaultPackage()]);

  // Inline validation errors
  const [gameInfoErrors, setGameInfoErrors] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<number, Record<string, string>>>({});
  const [pkgErrors, setPkgErrors] = useState<Record<number, Record<string, string>>>({});

  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState('');

  // ── Field helpers ──────────────────────────────────────────────────
  const addField = () => setFields((prev) => [...prev, defaultField()]);
  const removeFieldLocally = (i: number) => setFields((prev) => prev.filter((_, idx) => idx !== i));
  const updateField = (i: number, key: keyof FieldForm, value: unknown) =>
    setFields((prev) => prev.map((f, idx) => (idx === i ? { ...f, [key]: value } : f)));
  const handleDeleteHelp = (_fieldIndex: number, helpIndex: number) => {
    updateField(_fieldIndex, 'helps', (fields[_fieldIndex].helps ?? []).filter((_, idx) => idx !== helpIndex));
  };

  // ── Package helpers ────────────────────────────────────────────────
  const addPackage = () => setPackages((prev) => [...prev, defaultPackage()]);
  const removePackageLocally = (i: number) => setPackages((prev) => prev.filter((_, idx) => idx !== i));
  const updatePackage = (i: number, key: keyof PackageForm, value: unknown) =>
    setPackages((prev) => prev.map((p, idx) => (idx === i ? { ...p, [key]: value } : p)));

  // ── Validation ─────────────────────────────────────────────────────
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!gameName.trim()) newErrors.name = 'Game name is required.';
    if (!selectedCategory) newErrors.category = 'Category is required.';

    const fErrors: Record<number, Record<string, string>> = {};
    fields.forEach((f, i) => {
      const e: Record<string, string> = {};
      if (!f.title.trim()) e.title = 'Title is required.';
      if (Object.keys(e).length) fErrors[i] = e;
    });

    const pErrors: Record<number, Record<string, string>> = {};
    packages.forEach((p, i) => {
      const e: Record<string, string> = {};
      if (!p.name.trim()) e.name = 'Name is required.';
      if (!p.amount.trim()) e.amount = 'Amount is required.';
      if (!p.price || parseFloat(p.price) <= 0) e.price = 'Price must be greater than 0.';
      if (p.stock_mode === 'manual' && !p.manual_fulfillment_time)
        e.manual_fulfillment_time = 'Fulfillment time is required for manual mode.';
      if (p.stock_mode === 'automatic' && (!p.codes || !p.codes.trim()))
        e.codes = 'At least one fulfillment code is required for automatic delivery.';
      if (Object.keys(e).length) pErrors[i] = e;
    });

    setGameInfoErrors(newErrors);
    setFieldErrors(fErrors);
    setPkgErrors(pErrors);

    return (
      Object.keys(newErrors).length === 0 &&
      Object.keys(fErrors).length === 0 &&
      Object.keys(pErrors).length === 0
    );
  };

  // ── Submit ─────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the errors before submitting.');
      return;
    }

    setSubmitting(true);
    let topupGameId = 0;

    try {
      setStep('Creating product…');
      const productFormData = new FormData();
      productFormData.append('name', gameName.trim());
      productFormData.append('product_type', 'topup');
      productFormData.append('stock_mode', 'manual');
      productFormData.append('manual_fulfillment_time', '5');
      productFormData.append('region', region);
      if (selectedCategory) productFormData.append('category', selectedCategory);
      if (shortDescription.trim())
        productFormData.append('short_description', shortDescription.trim());
      if (imageFile) {
        productFormData.append('logo', imageFile);
        productFormData.append('images[0][image]', imageFile);
        productFormData.append('images[0][is_main]', 'true');
      }
      productFormData.append('is_available', String(isAvailable));
      productFormData.append('is_featured', String(isFeatured));

      const productResult = await dashboardService.adminCreateProductFull(productFormData);
      const productSlug: string = productResult?.slug ?? '';
      if (!productSlug) throw new Error('Product creation failed — no slug returned.');

      setStep('Creating top-up game…');
      const gameData = await topupService.adminTopupDetail(productSlug);
      topupGameId = gameData?.id ?? 0;

      if (!topupGameId) throw new Error('TopUp game not found after product creation.');

      if (!isActive) {
        await topupService.adminUpdateTopup(productSlug, { is_active: isActive });
      }

      if (fields.some((f) => f.title)) {
        setStep('Saving fields…');
        for (const field of fields) {
          if (!field.title.trim()) continue;
          const autoKey =
            field.title
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9\u0600-\u06ff]+/g, '-')
              .replace(/^-+|-+$/g, '') || `field-${Date.now()}`;
          const result = await topupService.adminAddField({
            game: topupGameId,
            title: field.title,
            placeholder: field.placeholder,
            key: autoKey,
            field_type: field.field_type,
            is_required: field.is_required,
            min_input_length: field.min_input_length,
            order: field.order,
          });
          const created = Array.isArray(result) ? result[0] : result;
          if (created?.id) {
            for (const help of field.helps ?? []) {
              if (!help.description.trim()) continue;
              const helpFd = new FormData();
              helpFd.append('description', help.description);
              helpFd.append('field', String(created.id));
              if (help.imageFile) helpFd.append('image', help.imageFile);
              await topupService.adminAddFieldHelp(helpFd);
            }
          }
        }
      }

      if (packages.some((p) => p.name || p.price)) {
        setStep('Saving packages…');
        const pkgCodesTasks: { codes: string; package_id: string }[] = [];
        
        for (const pkg of packages) {
          if (!pkg.name.trim() || !pkg.price) continue;
          const pkgFd = new FormData();
          pkgFd.append('game', String(topupGameId));
          pkgFd.append('name', pkg.name);
          pkgFd.append('amount', pkg.amount);
          pkgFd.append('price', pkg.price);
          pkgFd.append('stock_mode', pkg.stock_mode);
          pkgFd.append('is_active', String(pkg.is_active));
          pkgFd.append('is_popular', String(pkg.is_popular));
          pkgFd.append('order', String(pkg.order));
          if (pkg.stock_mode === 'manual' && pkg.manual_fulfillment_time)
            pkgFd.append('manual_fulfillment_time', pkg.manual_fulfillment_time);
            
          const result = await topupService.adminAddPackage(pkgFd);
          
          if (pkg.stock_mode === 'automatic' && pkg.codes.trim() && result?.id) {
            pkgCodesTasks.push({ codes: pkg.codes, package_id: String(result.id) });
          }
        }
        
        if (pkgCodesTasks.length > 0) {
          setStep('Attaching codes to packages…');
          try {
            await Promise.all(
              pkgCodesTasks.map((payload) => codeService.adminAddUpdateDeleteCodes(productSlug, payload))
            );
          } catch (e) {
            console.error('Failed to attach codes', e);
            toast.error('Packages created but failed to attach some fulfillment codes.');
          }
        }
      }

      toast.success('Top-up game created successfully!');
      await authService.clearCache();
      queryClient.invalidateQueries({ queryKey: ['admin', 'topups'] });
      router.push(`/dashboard/topups`);
    } catch (err: unknown) {
      const axErr = err as {
        response?: { data?: { errors?: Record<string, string[]> } };
        message?: string;
      };
      const serverErrors = axErr?.response?.data?.errors;
      if (serverErrors) {
        const msg = Object.entries(serverErrors)
          .map(([k, v]) => `${k}: ${v.join(', ')}`)
          .join(' | ');
        toast.error(msg);
      } else {
        toast.error(axErr?.message ?? 'Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
      setStep('');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/topups">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Add Top-Up Game
          </h1>
          <p className="text-muted-foreground mt-1">
            Fill in the details, fields, and packages — all in one step.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
          currentLogo={null}
          isActive={isActive}
          setIsActive={setIsActive}
          isAvailable={isAvailable}
          setIsAvailable={setIsAvailable}
          isFeatured={isFeatured}
          setIsFeatured={setIsFeatured}
          gameInfoErrors={gameInfoErrors}
          setGameInfoErrors={setGameInfoErrors}
          hideSaveButton={true}
        />

        <FieldsTab
          fields={fields}
          addField={addField}
          updateField={updateField}
          removeFieldLocally={removeFieldLocally}
          handleDeleteHelp={handleDeleteHelp}
          setDeleteTarget={() => {}}
          fieldErrors={fieldErrors}
          setFieldErrors={setFieldErrors}
          hideSaveButton={true}
        />

        <PackagesTab
          packages={packages}
          addPackage={addPackage}
          updatePackage={updatePackage}
          removePackageLocally={removePackageLocally}
          setDeleteTarget={() => {}}
          pkgErrors={pkgErrors}
          setPkgErrors={setPkgErrors}
          hideSaveButton={true}
        />

        <div className="flex items-center justify-end pt-4 border-t border-border mt-8">
          <Button
            type="submit"
            disabled={submitting}
            className="bg-primary hover:bg-primary-hover text-primary-foreground min-w-37.5 gap-2">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {step || 'Saving…'}
              </>
            ) : (
              'Create Top-Up Game'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
