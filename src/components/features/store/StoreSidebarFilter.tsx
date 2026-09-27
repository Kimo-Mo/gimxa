'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { catalogService } from '@/services/catalog.service';
import { ProductCategory, ProductTag, Region, Platform, ProductTypeEntity } from '@/types';

export interface StoreFilterState {
  category?: string[];
  tag?: string[];
  is_popular: boolean;
  is_available: boolean;
  price_min: number;
  price_max: number;
  ordering: string;
  region: string;
  platform: string;
  type: string;
}

interface StoreSidebarFilterProps {
  className?: string;
  filters: StoreFilterState;
  search: string;
  setSearch: (search: string) => void;
  onChange: (filters: StoreFilterState) => void;
}



export default function StoreSidebarFilter({
  className,
  filters,
  search,
  setSearch,
  onChange,
}: StoreSidebarFilterProps) {
  const { data: categoriesResponse } = useQuery({
    queryKey: ['publicCategories'],
    queryFn: () => catalogService.publicCategoriesList(),
  });

  const { data: tagsResponse } = useQuery({
    queryKey: ['publicTags'],
    queryFn: () => catalogService.publicTagsList(),
  });

  const { data: regionsResponse } = useQuery({
    queryKey: ['publicRegionsList'],
    queryFn: () => catalogService.publicRegionsList(),
  });

  const { data: platformsResponse } = useQuery({
    queryKey: ['publicPlatformsList'],
    queryFn: () => catalogService.publicPlatformsList(),
  });

  const { data: typesResponse } = useQuery({
    queryKey: ['publicTypesList'],
    queryFn: () => catalogService.publicTypesList(),
  });

  const categoriesData: ProductCategory[] = Array.isArray(categoriesResponse)
    ? categoriesResponse
    : categoriesResponse?.data || [];
  const categories = categoriesData;
  const tags: ProductTag[] = Array.isArray(tagsResponse) ? tagsResponse : tagsResponse?.data || [];

  // More robust extraction for regions
  const regions: Region[] = regionsResponse?.data || (Array.isArray(regionsResponse) ? regionsResponse : []);
  const platforms: Platform[] = platformsResponse?.data || (Array.isArray(platformsResponse) ? platformsResponse : []);
  const types: ProductTypeEntity[] = typesResponse?.data || (Array.isArray(typesResponse) ? typesResponse : []);

  const handleCategoryChange = (slug: string, checked: boolean) => {
    onChange({
      ...filters,
      category: checked
        ? [...(filters.category || []), slug]
        : (filters.category || []).filter((categorySlug) => categorySlug !== slug),
    });
  };

  const handleTagChange = (slug: string, checked: boolean) => {
    onChange({
      ...filters,
      tag: checked
        ? [...(filters.tag || []), slug]
        : (filters.tag || []).filter((tagSlug) => tagSlug !== slug),
    });
  };

  const handleRegionChange = (value: string) => {
    onChange({
      ...filters,
      region: value,
    });
  };

  return (
    <div className={cn('space-y-6 w-full p-6', className)}>
      {/* Search has been moved to StoreClient.tsx */}

      {/* Checkboxes (Available & Popular) */}
      <div className="space-y-3 pt-2">
        <label className="flex items-center space-x-3 cursor-pointer group">
          <Checkbox
            checked={filters.is_available}
            onCheckedChange={(checked) => onChange({ ...filters, is_available: !!checked })}
          />
          <span className="text-sm font-semibold group-hover:text-primary transition-colors">
            Exclude out of stock products
          </span>
        </label>
        <label className="flex items-center space-x-3 cursor-pointer group">
          <Checkbox
            checked={filters.is_popular}
            onCheckedChange={(checked) => onChange({ ...filters, is_popular: !!checked })}
          />
          <span className="text-sm font-semibold group-hover:text-primary transition-colors">
            Popular Products Only
          </span>
        </label>
      </div>

      {/* Price Range */}
      <div className="space-y-4 pt-4 border-t border-border">
        <Label className="text-sm font-semibold" htmlFor="filter-min-price">
          Price Range
        </Label>
        <div className="flex items-center space-x-2">
          <Input
            type="number"
            id="filter-min-price"
            value={filters.price_min}
            onChange={(e) => onChange({ ...filters, price_min: Number(e.target.value) })}
            className="w-full border-border text-sm h-10 text-center"
          />
          <span>-</span>
          <Input
            type="number"
            id="filter-max-price"
            value={filters.price_max}
            onChange={(e) => onChange({ ...filters, price_max: Number(e.target.value) })}
            className="w-full border-border text-sm h-10 text-center"
          />
        </div>
      </div>

      {/* Accordions (Categories, Tags, Regions) */}
      <div className="pt-2">
        <Accordion type="single" defaultValue="categories" className="w-full space-y-2">
          {/* Categories */}
          <AccordionItem value="categories" className="border-none">
            <AccordionTrigger className="hover:no-underline py-3 px-0 font-semibold text-sm cursor-pointer">
              Categories
            </AccordionTrigger>
            <AccordionContent>
              <div className="text-sm text-muted-foreground space-y-3 py-1 pl-1 max-h-48 overflow-y-auto scrollbar-hide">
                {categories.length === 0 ? (
                  <div className="text-sm">None available.</div>
                ) : (
                  categories.map((c) => (
                    <label key={c.id} className="flex items-center space-x-3 cursor-pointer">
                      <Checkbox
                        checked={(filters.category || []).includes(c.slug)}
                        onCheckedChange={(checked) => handleCategoryChange(c.slug, !!checked)}
                      />
                      <span className={`capitalize ${(filters.category || []).includes(c.slug) ? "text-primary font-bold" : ""}`}>{c.name}</span>
                    </label>
                  ))
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Tags */}
          <AccordionItem value="tags" className="border-none">
            <AccordionTrigger className="hover:no-underline py-3 px-0 font-semibold text-sm cursor-pointer">
              Tags
            </AccordionTrigger>
            <AccordionContent>
              <div className="text-sm text-muted-foreground space-y-3 py-1 pl-1 max-h-48 overflow-y-auto scrollbar-hide">
                {tags.length === 0 ? (
                  <div className="text-sm">None available.</div>
                ) : (
                  tags.map((t) => (
                    <label key={t.id} className="flex items-center space-x-3 cursor-pointer">
                      <Checkbox
                        checked={(filters.tag || []).includes(t.slug)}
                        onCheckedChange={(checked) => handleTagChange(t.slug, !!checked)}
                      />
                      <span className={`capitalize ${(filters.tag || []).includes(t.slug) ? "text-primary font-bold" : ""}`}>{t.name}</span>
                    </label>
                  ))
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Regions */}
          <AccordionItem value="regions" className="border-none">
            <AccordionTrigger className="hover:no-underline py-3 px-0 font-semibold text-sm cursor-pointer">
              Region
            </AccordionTrigger>
            <AccordionContent>
              <RadioGroup
                value={filters.region || ''}
                onValueChange={handleRegionChange}
                className="space-y-3 py-1 pl-1 max-h-48 overflow-y-auto scrollbar-hide">
                <div className="text-sm text-muted-foreground space-y-3 py-1 pl-1 max-h-48 overflow-y-auto scrollbar-hide">
                  {regions.length === 0 ? (
                    <div className="text-sm">None available.</div>
                  ) : (
                    regions.map((r) => (
                      <div key={r.id} className="flex items-center space-x-3">
                        <RadioGroupItem value={r.slug} id={`region-${r.slug}`} />
                        <Label htmlFor={`region-${r.slug}`} className={`cursor-pointer font-normal capitalize ${(filters.region || '').includes(r.slug) ? "text-primary font-bold" : ""}`}>
                          {r.name}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </RadioGroup>
            </AccordionContent>
          </AccordionItem>

          {/* Platforms */}
          <AccordionItem value="platforms" className="border-none">
            <AccordionTrigger className="hover:no-underline py-3 px-0 font-semibold text-sm cursor-pointer">
              Platform
            </AccordionTrigger>
            <AccordionContent>
              <RadioGroup
                value={filters.platform || ''}
                onValueChange={(val) => onChange({ ...filters, platform: val })}
                className="space-y-3 py-1 pl-1 max-h-48 overflow-y-auto scrollbar-hide">
                <div className="text-sm text-muted-foreground space-y-3 py-1 pl-1 max-h-48 overflow-y-auto scrollbar-hide">
                  {platforms.length === 0 ? (
                    <div className="text-sm">None available.</div>
                  ) : (
                    platforms.map((p) => (
                      <div key={p.id} className="flex items-center space-x-3">
                        <RadioGroupItem value={p.slug} id={`platform-${p.slug}`} />
                        <Label htmlFor={`platform-${p.slug}`} className={`cursor-pointer font-normal capitalize ${(filters.platform || '').includes(p.slug) ? "text-primary font-bold" : ""}`}>
                          {p.name}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </RadioGroup>
            </AccordionContent>
          </AccordionItem>

          {/* Types */}
          <AccordionItem value="types" className="border-none">
            <AccordionTrigger className="hover:no-underline py-3 px-0 font-semibold text-sm cursor-pointer">
              Type
            </AccordionTrigger>
            <AccordionContent>
              <RadioGroup
                value={filters.type || ''}
                onValueChange={(val) => onChange({ ...filters, type: val })}
                className="space-y-3 py-1 pl-1 max-h-48 overflow-y-auto scrollbar-hide">
                <div className="text-sm text-muted-foreground space-y-3 py-1 pl-1 max-h-48 overflow-y-auto scrollbar-hide">
                  {types.length === 0 ? (
                    <div className="text-sm">None available.</div>
                  ) : (
                    types.map((t) => (
                      <div key={t.id} className="flex items-center space-x-3">
                        <RadioGroupItem value={t.slug} id={`type-${t.slug}`} />
                        <Label htmlFor={`type-${t.slug}`} className={`cursor-pointer font-normal capitalize ${(filters.type || '').includes(t.slug) ? "text-primary font-bold" : ""}`}>
                          {t.name}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </RadioGroup>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Clear Button */}
      <div className="pt-4 border-t border-border">
        <Button
          variant="outline"
          className="w-full font-semibold"
          onClick={() => {
            setSearch('');
            onChange({
              category: [],
              tag: [],
              is_popular: false,
              is_available: false,
              price_min: 0,
              price_max: 9999,
              ordering: 'price',
              region: '',
              platform: '',
              type: '',
            });
          }}>
          Clear Filters
        </Button>
      </div>
    </div>
  );
}

