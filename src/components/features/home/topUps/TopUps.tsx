'use client';

import { useState } from 'react';
import { CategoryBanners } from './CategoryBanners';
import { TopUpFilters } from './TopUpFilters';
import { TopUpHeroSlider } from './TopUpHeroSlider';
import { TopUpGrid } from './sections/TopUpGrid';
import { TopUpHeader } from './sections/TopUpHeader';
import { useSearchParams } from 'next/navigation';
export type TopupFilterTypes = 'all' | 'topup-mobile' | 'topup-service';
export const TopUps = () => {
  const params = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(params.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState<TopupFilterTypes>('all');

  return (
    <div className="flex flex-col gap-12 w-full pb-12">
      {/* Top Section: Hero Slider + Category Banners */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Hero Slider */}
        <div className="lg:col-span-2 relative h-70 lg:h-auto">
          <TopUpHeroSlider />
        </div>

        {/* Right Column - Category Banners */}
        <div className="h-full">
          <CategoryBanners onSelectCategory={setSelectedCategory} />
        </div>
      </div>

      {/* Header & Filter Section */}
      <div id="top-ups" className="space-y-6">
        <TopUpHeader />
        <TopUpFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
        />
      </div>

      {/* Product Grid */}
      <TopUpGrid searchQuery={searchQuery} selectedCategory={selectedCategory} />
    </div>
  );
};
