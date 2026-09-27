import { Metadata } from 'next';
import { Suspense } from 'react';
import { topupService } from '@/services/topup.service';
import { TopupDetailClient } from '@/components/features/product/TopupDetailClient';
import { Skeleton } from '@/components/ui';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    if (!slug) throw new Error('No slug provided');

    const topup = await topupService.publicTopupDetail(slug);
    const product = topup.product;
    return {
      title: `${product.name} Top Up | Gimxa`,
      description:
        product.short_description || `Top up your ${product.name} account securely on Gimxa.`,
      openGraph: {
        title: `${product.name} Top Up | Gimxa`,
        description:
          product.short_description || `Top up your ${product.name} account securely on Gimxa.`,
        url: `https://gimxa.com/topup/${slug}`,
        images: product.main_image && product.main_image.image,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      title: 'Top Up Not Found | Gimxa',
      description: 'The requested top up could not be found.',
    };
  }
}



export default async function TopupDetailPage({ params }: Props) {
  const { slug } = await params;
  return (
    <Suspense
      fallback={
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
      }
    >
      <TopupDetailClient slug={slug} />
    </Suspense>
  );
}
