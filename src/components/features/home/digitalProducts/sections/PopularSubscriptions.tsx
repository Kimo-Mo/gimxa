'use client';

import ProductGrid from '@/components/features/product/ProductGrid';
import { Button } from '@/components/ui';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { catalogService } from '@/services/catalog.service';

export const PopularSubscriptions = () => {
  const {
    data: pageData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      'popularSubscriptions',
      { categories: 'subscriptions', is_popular: true, page_size: 4 },
    ],
    queryFn: () =>
      catalogService.advancedSearch({
        categories: 'subscriptions',
        is_popular: true,
        page_size: 4,
      }),
  });

  const products = pageData?.results;
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black tracking-tight text-foreground">
          Popular Subscriptions
        </h2>
        <Link href="/store?category=subscriptions&is_popular=true" className="group">
          <Button
            variant="ghost"
            className="text-muted-foreground group-hover:text-foreground transition-colors">
            View All{' '}
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>

      <ProductGrid products={products} isLoading={isLoading} error={error} limit={4} />
    </section>
  );
};
