import { Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Product } from '@/types';

interface CodesFiltersProps {
  selectedProduct: string;
  onSelectedProductChange: (value: string) => void;
  products: Product[];
  productsLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  loading: boolean;
  onRefresh: () => void;
}

export function CodesFilters({
  selectedProduct,
  onSelectedProductChange,
  products,
  productsLoading,
  search,
  onSearchChange,
  loading,
  onRefresh,
}: CodesFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
      <Select
        value={selectedProduct}
        onValueChange={onSelectedProductChange}
        disabled={productsLoading}>
        <SelectTrigger
          id="product-filter"
          className="w-full sm:w-52 bg-background border-border h-9 text-sm">
          <SelectValue placeholder="All products" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          <SelectItem value="all">All products</SelectItem>
          {products
            .filter((p) => p.product_type !== 'topup')
            .map((p) => (
              <SelectItem key={p.id} value={p.slug}>
                {p.name}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
      <div className="relative w-full sm:w-56">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="codes-search"
          placeholder="Search code, game, package…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 bg-background border-border h-9 text-sm"
        />
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={onRefresh}
        disabled={loading}
        className="border-border h-9 w-9 shrink-0">
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      </Button>
    </div>
  );
}
