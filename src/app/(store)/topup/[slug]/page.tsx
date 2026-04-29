import { Metadata } from 'next';
import { topupService } from '@/services/topup.service';
import { TopupDetailClient } from '@/components/features/product/TopupDetailClient';

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
      title: `${product.name} Top-up | Gimxa`,
      description:
        product.short_description || `Top up your ${product.name} account securely on Gimxa.`,
      openGraph: {
        title: `${product.name} Top-up | Gimxa`,
        description:
          product.short_description || `Top up your ${product.name} account securely on Gimxa.`,
        url: `https://gimxa.com/topup/${slug}`,
        images: product.main_image && product.main_image.image,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      title: 'Top-up Not Found | Gimxa',
      description: 'The requested top-up could not be found.',
    };
  }
}

export default async function TopupDetailPage({ params }: Props) {
  const { slug } = await params;
  return <TopupDetailClient slug={slug} />;
}
