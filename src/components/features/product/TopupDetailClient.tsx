'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCartStore } from '@/lib/stores/useCartStore';
import { Button, Separator } from '@/components/ui';
import { Skeleton } from '@/components/ui';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import {
  TopupGallery,
  ProductHeader,
  ProductPriceCard,
  ProductTopUpForm,
  ProductTopUpOptions,
} from '@/components/features/product';
import { topupService } from '@/services/topup.service';
import { Product, ProductImage, TopUpPackage } from '@/types';

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
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
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

  const pricingProduct = topup?.product
    ? ({
        ...topup.product,
        price: selectedPackage?.price ?? topup.product.price ?? null,
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
    if (!isValid) return;

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

  if (isLoading) {
    return (
      <div className="main_container py-8 space-y-8">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-3 space-y-4">
            <Skeleton className="aspect-3/4 w-full rounded-2xl" />
          </div>
          <div className="lg:col-span-6 space-y-6">
            <Skeleton className="h-12 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-40 rounded-lg" />
          </div>
          <div className="lg:col-span-3 space-y-4">
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !topup?.product) {
    return (
      <div className="main_container py-20 text-center">
        <h2 className="text-2xl font-bold">Product not found</h2>
        <Button onClick={() => router.push('/store')} className="mt-4">
          Return to Store
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground overflow-hidden whitespace-nowrap">
        <Link href="/" className="hover:text-primary transition-colors">
          Home
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/store" className="hover:text-primary transition-colors">
          Store
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground font-medium truncate">{topup.product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-3">
          <TopupGallery
            main_image={topup.product.main_image as ProductImage}
            name={topup.product.name}
          />
        </div>

        <div className="lg:col-span-6 flex flex-col gap-6">
          <ProductHeader product={topup.product} />
          <Separator />
          {topup.product.short_description && (
            <p className="text-muted-foreground text-sm leading-relaxed">
              {topup.product.short_description}
            </p>
          )}
          <ProductTopUpForm
            fields={fields}
            formData={formData}
            setFormData={handleFormDataChange}
            errors={fieldErrors}
          />
          <ProductTopUpOptions
            options={packageOptions}
            selectedOptionId={activePackageId}
            onSelect={setSelectedPackageId}
          />
        </div>

        <div className="lg:col-span-3">
          <ProductPriceCard
            product={pricingProduct ?? topup.product}
            onAddToCart={() => undefined}
            onBuyNow={onBuyNow}
            showAddToCart={false}
          />
        </div>
      </div>
    </div>
  );
}
