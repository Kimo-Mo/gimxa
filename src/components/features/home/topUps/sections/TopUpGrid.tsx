'use client';

import { useQuery } from '@tanstack/react-query';
import { TopUpCard } from '../TopUpCard';
import { Skeleton } from '@/components/ui';
import { TopUp } from '@/types';
import { topupService } from '@/services/topup.service';

interface TopUpGridProps {
  searchQuery: string;
  selectedCategory: string;
}

export const TopUpGrid = ({ searchQuery, selectedCategory }: TopUpGridProps) => {
  const {
    data: pageData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['topups-page', searchQuery, selectedCategory],
    queryFn: () => topupService.publicTopupsList(),
  });
  const filteredData =
    searchQuery.trim() === '' && selectedCategory === 'all'
      ? pageData?.results
      : searchQuery.trim() !== ''
        ? pageData?.results.filter((item: TopUp) =>
            item.product.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : pageData?.results.filter((item: TopUp) =>
            item.product.categories.find((category) => category.slug === selectedCategory)
          );
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-8">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error || filteredData?.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center">
        <h3 className="text-2xl font-bold mb-2">No top-ups found</h3>
        <p className="text-muted-foreground max-w-md">
          {error
            ? 'An error occurred while loading top-ups.'
            : 'Try adjusting your filters or search query.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-8">
      {filteredData.map((item: TopUp) => (
        <TopUpCard key={item.id} item={item} />
      ))}
    </div>
  );
};
