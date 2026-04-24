'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { catalogService } from '@/services/catalog.service';
import { useCartStore } from '@/lib/stores/useCartStore';
import { Button, Separator } from '@/components/ui';
import { Skeleton } from '@/components/ui';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import {
  ProductGallery,
  ProductHeader,
  ProductInfo,
  ProductPriceCard,
} from '@/components/features/product';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const clearCart = useCartStore((state) => state.clearCart);

  const { data: product, isLoading,error } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => catalogService.publicProductDetail(slug as string),
  });

  const onAddToCart = () => {
    if (!product) return;
    addItem(product, 1);
    toast.success(`${product.name} added to cart!`);
  };

  const onBuyNow = async () => {
    if (!product) return;
    await clearCart();
    await addItem(product, 1);
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

  if (error || !product) {
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
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground overflow-hidden whitespace-nowrap">
        <Link href="/" className="hover:text-primary transition-colors">
          Home
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/store" className="hover:text-primary transition-colors">
          Store
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground font-medium truncate">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Images */}
        <div className="lg:col-span-3">
          <ProductGallery images={product.images} name={product.name} />
        </div>

        {/* Center Column - Product Details */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <ProductHeader product={product} />
          <Separator />
          <ProductInfo product={product} />
        </div>

        {/* Right Column - Sticky Price Card */}
        <div className="lg:col-span-3">
          <ProductPriceCard product={product} onAddToCart={onAddToCart} onBuyNow={onBuyNow} />
        </div>
      </div>
    </div>
  );
}
