'use client';

import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCartStore } from '@/lib/stores/useCartStore';
import { Button, Separator } from '@/components/ui';
import { Skeleton } from '@/components/ui';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import {
  ProductHeader,
  ProductPriceCard,
  ProductTopUpForm,
  ProductTopUpOptions,
  ProductInfo,
} from '@/components/features/product';
import { ProductGallery } from '@/components/features/product/details/ProductGallery';
import { ProductSpecifications } from '@/components/features/product/details/ProductSpecifications';
import { ProductDescription } from '@/components/features/product/details/ProductDescription';
import { RelatedProducts } from '@/components/features/product/RelatedProducts';
import { topupService } from '@/services/topup.service';
import { Product, ProductImage, TopUpPackage } from '@/types';
import { getImageUrl } from '@/lib/utils';

type TopupHelp = {
  id?: number;
  description?: string;
  image?: string | null;
};

type TopupField = {
  id?: number;
  key: string;
  title: string;
  placeholder?: string;
  is_required?: boolean;
  field_type?: string;
  helps?: TopupHelp[];
};

type TopupDetailResponse = {
  id: number;
  product: Product;
  fields?: TopupField[];
  packages?: TopUpPackage[];
};

const normalizePackages = (payload: unknown): TopUpPackage[] => {
  if (Array.isArray(payload)) return payload as TopUpPackage[];
  if (payload && typeof payload === 'object') {
    const envelope = payload as { results?: unknown; data?: unknown };
    if (Array.isArray(envelope.results)) return envelope.results as TopUpPackage[];
    if (Array.isArray(envelope.data)) return envelope.data as TopUpPackage[];
  }
  return [];
};

const extractValidationErrors = (payload: unknown): Record<string, string> => {
  if (!payload || typeof payload !== 'object') return {};
  const envelope = payload as {
    errors?: unknown;
    field_errors?: unknown;
    detail?: unknown;
    message?: unknown;
  };
  const candidate = envelope.errors ?? envelope.field_errors;
  const output: Record<string, string> = {};

  if (candidate && typeof candidate === 'object') {
    Object.entries(candidate as Record<string, unknown>).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        output[key] = String(value[0]);
      } else if (typeof value === 'string') {
        output[key] = value;
      }
    });
  }

  if (Object.keys(output).length === 0) {
    const globalMessage =
      (typeof envelope.detail === 'string' && envelope.detail) ||
      (typeof envelope.message === 'string' && envelope.message) ||
      '';
    if (globalMessage) output._global = globalMessage;
  }

  return output;
};

interface TopupDetailClientProps {
  slug: string;
}

export function TopupDetailClient({ slug }: TopupDetailClientProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const searchParams = useSearchParams();
  const packageIdParam = searchParams.get('packageId');

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);

  useEffect(() => {
    if (packageIdParam) {
      setSelectedPackageId(parseInt(packageIdParam, 10));
    }
  }, [packageIdParam]);

  const topupSlug = slug;

  const {
    data: topup,
    isLoading,
    error,
  } = useQuery<TopupDetailResponse>({
    queryKey: ['topup-detail', topupSlug],
    queryFn: () => topupService.publicTopupDetail(topupSlug),
    enabled: Boolean(topupSlug),
  });

  const { data: packagesResponse } = useQuery({
    queryKey: ['topup-packages', topupSlug],
    queryFn: () => topupService.publicPackagesList(topupSlug),
    enabled: Boolean(topupSlug),
  });

  const fields = topup?.fields ?? [];
  const packageOptions = useMemo(() => {
    const fromPackagesEndpoint = normalizePackages(packagesResponse);
    if (fromPackagesEndpoint.length > 0) return fromPackagesEndpoint;
    return normalizePackages(topup?.packages ?? []);
  }, [packagesResponse, topup?.packages]);

  const activePackageId =
    selectedPackageId && packageOptions.some((item) => item.id === selectedPackageId)
      ? selectedPackageId
      : (packageOptions[0]?.id ?? null);

  const selectedPackage = useMemo(
    () => packageOptions.find((item) => item.id === activePackageId) ?? null,
    [packageOptions, activePackageId]
  );

  const activePackagePrice = selectedPackage?.price ?? topup?.product.price ?? null;
  const activePackageOriginalPrice = selectedPackage?.price_before_offer ?? topup?.product.price_before_offer ?? null;
  const computedOfferValue =
    activePackageOriginalPrice && activePackagePrice && activePackageOriginalPrice > activePackagePrice
      ? String(Math.round(((activePackageOriginalPrice - activePackagePrice) / activePackageOriginalPrice) * 100))
      : null;

  const pricingProduct = topup?.product
    ? ({
      ...topup.product,
      price: activePackagePrice,
      price_before_offer: activePackageOriginalPrice,
      offer_value: selectedPackage?.offer_value ?? topup.product.offer_value ?? computedOfferValue,
      is_topup: true,
      currency: selectedPackage?.currency ?? topup.product.currency ?? null,
    } as Product)
    : null;

  const handleFormDataChange = (next: Record<string, string>) => {
    setFormData(next);
    setFieldErrors((prev) => {
      const updated = { ...prev };
      Object.keys(next).forEach((key) => {
        if ((next[key] ?? '').trim()) delete updated[key];
      });
      return updated;
    });
  };

  const validateTopupForm = async () => {
    if (!topup) return false;
    const localErrors: Record<string, string> = {};

    fields.forEach((field) => {
      const value = (formData[field.key] ?? '').trim();
      if (field.is_required && !value) {
        localErrors[field.key] = `${field.title} is required.`;
      }
    });

    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors);
      return false;
    }

    try {
      const response = await topupService.validateTopupFields({
        product_slug: String(topup.product.slug),
        data: formData,
      });
      const apiErrors = extractValidationErrors(response);
      if (Object.keys(apiErrors).length > 0) {
        setFieldErrors(apiErrors);
        if (apiErrors._global) toast.error(apiErrors._global);
        return false;
      }
      setFieldErrors({});
      return true;
    } catch {
      toast.error('Failed to validate top-up fields. Please try again.');
      return false;
    }
  };

  const onBuyNow = async () => {
    if (!topup?.product) return;
    const isValid = await validateTopupForm();
    if (!isValid) {
      document.getElementById('topup-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const cartPayload = {
      ...formData,
      package_id: selectedPackage ? String(selectedPackage.id) : '',
      package_name: selectedPackage?.name ?? '',
      package_price: selectedPackage ? String(selectedPackage.price) : '',
      package_currency: selectedPackage?.currency ?? '',
      package_amount: selectedPackage?.amount ?? '',
    };
    const selectedPricedProduct = pricingProduct ?? topup.product;
    await clearCart();
    await addItem(selectedPricedProduct, 1, cartPayload);
    router.push('/checkout');
  };

  const handleSelectPackage = (id: number) => {
    setSelectedPackageId(id);
    const params = new URLSearchParams(searchParams.toString());
    params.set('packageId', id.toString());
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  // ─── Loading skeleton ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="py-8 space-y-8">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-3">
            <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
          </div>
          <div className="lg:col-span-4 space-y-6">
            <Skeleton className="h-12 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" /><Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-40 rounded-lg" />
            <Skeleton className="h-52 rounded-2xl" />
          </div>
          <div className="lg:col-span-3 space-y-4">
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // ─── Error state ─────────────────────────────────────────────────────────────
  if (error || !topup?.product) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-2xl font-bold">Top-Up not found</h2>
        <Button onClick={() => router.push('/store')} className="mt-4">
          Return to Store
        </Button>
      </div>
    );
  }

  const product = topup.product;

  // Resolve hero background image
  const heroSrc = product.main_image
    ? getImageUrl((product.main_image as { image: string }).image)
    : null;

  return (
    // pb-20 lg:pb-0 reserves clearance for the mobile sticky bottom bar
    <div className="space-y-10 pb-20 lg:pb-0">

      {/* ──────────────────────────────────────────────────────────
          Hero Section — blurred product image as background
      ────────────────────────────────────────────────────────── */}
      <div className="relative -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 -mt-6 pt-6 pb-8 overflow-hidden">
        {/* Background artwork — limited to the first viewport height */}
        {heroSrc && (
          <div className="absolute inset-x-0 top-0 h-screen pointer-events-none overflow-hidden select-none">
            <div
              className="absolute inset-0 w-full h-full bg-center bg-no-repeat bg-cover opacity-30 blur-[2px] scale-[1.5] md:scale-110"
              style={{ backgroundImage: `url(${heroSrc})` }}
            />
            {/* Vertical gradient: Sharp focus at top, fades to background at bottom of the screen */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/10 to-background" />

            {/* Side gradients: Blends edges */}
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent" />
            <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent" />
          </div>
        )}

        {/* Actual content above the blurred layer */}
        <div className="relative z-10 space-y-5">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground overflow-hidden whitespace-nowrap">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/topups" className="hover:text-primary transition-colors">Top-Ups</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-medium truncate">{product.name}</span>
          </nav>

          <ProductHeader product={product} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column — Gallery */}
            <div className="lg:col-span-5 space-y-12">
              <div className="sticky top-24 space-y-12">
                <ProductGallery
                  images={product.images}
                  name={product.name}
                />

                {/* Related Products Sidebar - Large Screens Only */}
                <div className="hidden lg:block">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-1.5 h-5 bg-primary rounded-full" />
                    <h3 className="font-bold text-lg">Related</h3>
                  </div>
                  <RelatedProducts slug={slug} isSidebar />
                </div>
              </div>
            </div>

            {/* Right Column — Content & Purchase (Spans 7 columns) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Top Section: Specs & Price Card */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                <div className="md:col-span-7 space-y-6">
                  <ProductSpecifications product={product} className="w-full" />
                  <ProductInfo product={product} hideDescription />
                </div>

                <div className="hidden md:block md:col-span-5">
                  <ProductPriceCard
                    product={pricingProduct ?? product}
                    onAddToCart={() => undefined}
                    onBuyNow={onBuyNow}
                    showAddToCart={false}
                    buyButtonText="Buy Now"
                  />
                </div>
              </div>

              <Separator />

              {/* Bottom Section: Account Info & Packages */}
              <div className="flex flex-col gap-8">
                {/* Account Information */}
                <div id="topup-form-section">
                  <ProductTopUpForm
                    fields={fields}
                    formData={formData}
                    setFormData={handleFormDataChange}
                    errors={fieldErrors}
                  />
                </div>

                {/* Package Options */}
                {packageOptions.length > 0 && (
                  <div className="flex flex-col gap-4 p-6 rounded-2xl bg-card border border-border shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1.5 h-6 bg-primary rounded-full" />
                      <h3 className="font-bold text-xl tracking-tight">Select a Package</h3>
                    </div>
                    <ProductTopUpOptions
                      options={packageOptions}
                      selectedOptionId={activePackageId}
                      onSelect={handleSelectPackage}
                    />
                  </div>
                )}

                {/* Mobile Price Card - Shown only on small screens below packages */}
                <div className="md:hidden">
                  <ProductPriceCard
                    product={pricingProduct ?? product}
                    onAddToCart={() => undefined}
                    onBuyNow={onBuyNow}
                    showAddToCart={false}
                    buyButtonText="Buy Now"
                  />
                </div>

                {/* About this product - Moved here for better large-screen flow */}
                {product.description && (
                  <div id="product-full-description" className="mt-4 pt-8 border-t border-border/40">
                    <ProductDescription description={product.description} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products - Mobile Only (at the bottom) */}
      <div className="lg:hidden mt-12">
        <RelatedProducts slug={slug} />
      </div>
    </div>
  );
}
