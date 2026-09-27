'use client';

import ProductSwiper from '@/components/features/product/ProductSwiper';
import { Button } from '@/components/ui';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { catalogService } from '@/services/catalog.service';

export const PopularPcGames = () => {
  const {
    data: pageData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['popularGames', { categories: 'pc-games', is_popular: true, page_size: 12 }],
    queryFn: () =>
      catalogService.advancedSearch({ categories: 'pc-games', is_popular: true, page_size: 12 }),
  });

  const products = pageData?.results;
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black tracking-tight text-foreground">Popular PC Games</h2>
        <Link href="/store?category=pc-games&is_popular=true" className="group">
          <Button
            variant="ghost"
            className="text-muted-foreground group-hover:text-foreground transition-colors">
            View All{' '}
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>

      <ProductSwiper products={products} isLoading={isLoading} error={error} />
    </section>
  );
};
