'use client';

import { Input } from '@/components/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';
import { TopupFilterTypes } from './TopUps';

interface TopUpFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: TopupFilterTypes;
  setSelectedCategory: (category: TopupFilterTypes) => void;
}

export const TopUpFilters = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
}: TopUpFiltersProps) => {
  return (
    <div className="mx-auto w-full md:w-2xl flex flex-col md:flex-row gap-4 items-center justify-between bg-card/50 p-6 rounded-2xl border border-border shadow-sm">
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search games..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-background/50"
        />
      </div>
      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
        <SelectTrigger className="w-full md:w-50 bg-background/50">
          <SelectValue placeholder="Category">
            {selectedCategory === 'all'
              ? 'All Categories'
              : selectedCategory === 'topup-mobile'
                ? 'Mobile Games'
                : 'Services'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          <SelectItem value="topup-mobile">Mobile Games</SelectItem>
          <SelectItem value="topup-service">Services</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
