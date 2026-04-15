import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ProductCategory } from '@/types/catalog';
import type { StockMode } from './types';

interface ProductBasicInfoProps {
  name: string;
  setName: (v: string) => void;
  price: string;
  setPrice: (v: string) => void;
  stockMode: StockMode;
  setStockMode: (v: StockMode) => void;
  manualFulfillmentTime: string;
  setManualFulfillmentTime: (v: string) => void;
  shortDescription: string;
  setShortDescription: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  isActive: boolean;
  setIsActive: (v: boolean) => void;
  isAvailable: boolean;
  setIsAvailable: (v: boolean) => void;
  isPopular: boolean;
  setIsPopular: (v: boolean) => void;
  isFeatured: boolean;
  setIsFeatured: (v: boolean) => void;
  region: string;
  setRegion: (v: string) => void;
  selectedCategory: string;
  setSelectedCategory: (v: string) => void;
  categories: ProductCategory[];
  errors: Record<string, string>;
  clearError: (field: string) => void;
}

export function ProductBasicInfo({
  name,
  setName,
  price,
  setPrice,
  stockMode,
  setStockMode,
  manualFulfillmentTime,
  setManualFulfillmentTime,
  shortDescription,
  setShortDescription,
  description,
  setDescription,
  isActive,
  setIsActive,
  isAvailable,
  setIsAvailable,
  isPopular,
  setIsPopular,
  isFeatured,
  setIsFeatured,
  region,
  setRegion,
  selectedCategory,
  setSelectedCategory,
  categories,
  errors,
  clearError,
}: ProductBasicInfoProps) {
  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-foreground text-base">Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label htmlFor="product-name" className="text-foreground text-sm">
              Product Name *
            </Label>
            <Input
              id="product-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearError('name');
              }}
              placeholder="e.g. FIFA 25 - PC Key"
              className={`bg-background ${errors.name ? 'border-destructive focus-visible:ring-destructive' : 'border-border'}`}
            />
            {errors.name && <p className="text-xs text-destructive mt-0.5">{errors.name}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="product-category" className="text-foreground text-sm">
              Category *
            </Label>
            <Select
              value={selectedCategory}
              onValueChange={(v) => {
                setSelectedCategory(v);
                clearError('category');
              }}>
              <SelectTrigger
                id="product-category"
                className={`bg-background ${errors.category ? 'border-destructive' : 'border-border'}`}>
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-xs text-destructive mt-0.5">{errors.category}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="product-price" className="text-foreground text-sm">
              Price ($) *
            </Label>
            <Input
              id="product-price"
              type="number"
              step="0.01"
              min={0}
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                clearError('price');
              }}
              placeholder="0.00"
              className={`bg-background ${errors.price ? 'border-destructive focus-visible:ring-destructive' : 'border-border'}`}
            />
            {errors.price && <p className="text-xs text-destructive mt-0.5">{errors.price}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stock-mode" className="text-foreground text-sm">
              Stock Mode *
            </Label>
            <Select
              value={stockMode}
              onValueChange={(v) => {
                setStockMode(v as StockMode);
                clearError('stockMode');
              }}>
              <SelectTrigger
                id="stock-mode"
                className={`bg-background ${errors.stockMode ? 'border-destructive' : 'border-border'}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="automatic">Automatic (instant delivery)</SelectItem>
                <SelectItem value="manual">Manual (fulfillment)</SelectItem>
              </SelectContent>
            </Select>
            {errors.stockMode && (
              <p className="text-xs text-destructive mt-0.5">{errors.stockMode}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="product-region" className="text-foreground text-sm">
              Region *
            </Label>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger id="product-region" className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="global">Global</SelectItem>
                <SelectItem value="eu">Europe (EU)</SelectItem>
                <SelectItem value="us">United States (US)</SelectItem>
                <SelectItem value="mena">Middle East &amp; Africa (MENA)</SelectItem>
                <SelectItem value="latam">Latin America (LATAM)</SelectItem>
                <SelectItem value="asia">Asia</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {stockMode === 'manual' && (
            <div className="space-y-1.5">
              <Label htmlFor="fulfillment-time" className="text-foreground text-sm">
                Fulfillment Time (minutes) *
              </Label>
              <Input
                id="fulfillment-time"
                type="number"
                min={1}
                value={manualFulfillmentTime}
                onChange={(e) => {
                  setManualFulfillmentTime(e.target.value);
                  clearError('manualFulfillmentTime');
                }}
                placeholder="e.g. 24"
                className={`bg-background ${errors.manualFulfillmentTime ? 'border-destructive focus-visible:ring-destructive' : 'border-border'}`}
              />
              {errors.manualFulfillmentTime && (
                <p className="text-xs text-destructive mt-0.5">{errors.manualFulfillmentTime}</p>
              )}
            </div>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="short-desc" className="text-foreground text-sm">
            Short Description
          </Label>
          <Input
            id="short-desc"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder="Brief product summary (max 500 chars)"
            className="bg-background border-border"
            maxLength={500}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description" className="text-foreground text-sm">
            Description
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Full product description…"
            rows={5}
            className="bg-background border-border resize-none"
          />
        </div>
        <div className="flex flex-wrap gap-6">
          {[
            { id: 'is-active', label: 'Active', state: isActive, setState: setIsActive },
            {
              id: 'is-available',
              label: 'Available for purchase',
              state: isAvailable,
              setState: setIsAvailable,
            },
            {
              id: 'is-popular',
              label: 'Mark as Popular',
              state: isPopular,
              setState: setIsPopular,
            },
            {
              id: 'is-featured',
              label: 'Featured Product',
              state: isFeatured,
              setState: setIsFeatured,
            },
          ].map(({ id, label, state, setState }) => (
            <label
              key={id}
              htmlFor={id}
              className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
              <input
                type="checkbox"
                id={id}
                checked={state}
                onChange={(e) => setState(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              {label}
            </label>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
