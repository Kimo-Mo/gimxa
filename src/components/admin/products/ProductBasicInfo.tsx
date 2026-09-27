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
import type { ProductCategory, Region, Platform, ProductTypeEntity } from '@/types/catalog';
import type { StockMode } from './types';
import dynamic from 'next/dynamic';
import { AttributeCreateDialog } from './AttributeCreateDialog';
import { AttributeEditDialog } from './AttributeEditDialog';
import Image from 'next/image';
import 'react-quill-new/dist/quill.snow.css';
import { getImageUrl } from '@/lib/utils';

const ReactQuill = dynamic(() => import('react-quill-new'), { 
  ssr: false,
  loading: () => <div className="h-[200px] w-full flex items-center justify-center border border-border rounded-md bg-muted/20">Loading Editor...</div>
});

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
  type: string;
  setType: (v: string) => void;
  platform: string;
  setPlatform: (v: string) => void;
  help: string;
  setHelp: (v: string) => void;
  priceBeforeOffer: string;
  setPriceBeforeOffer: (v: string) => void;
  offerValue: string;
  setOfferValue: (v: string) => void;
  selectedCategory: string;
  setSelectedCategory: (v: string) => void;
  categories: ProductCategory[];
  regions: Region[];
  types: ProductTypeEntity[];
  platforms: Platform[];
  errors: Record<string, string>;
  clearError: (field: string) => void;
  isLoaded?: boolean;
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
  type,
  setType,
  platform,
  setPlatform,
  help,
  setHelp,
  priceBeforeOffer,
  setPriceBeforeOffer,
  offerValue,
  setOfferValue,
  selectedCategory,
  setSelectedCategory,
  categories,
  regions,
  types,
  platforms,
  errors,
  clearError,
  isLoaded = true,
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
            <Label htmlFor="price-before-offer" className="text-foreground text-sm">
              Price Before Offer ($) *
            </Label>
            <Input
              id="price-before-offer"
              type="number"
              step="0.01"
              min={0}
              value={priceBeforeOffer}
              onChange={(e) => {
                setPriceBeforeOffer(e.target.value);
                clearError('priceBeforeOffer');
              }}
              placeholder="e.g. 19.99"
              className={`bg-background ${errors.priceBeforeOffer ? 'border-destructive focus-visible:ring-destructive' : 'border-border'}`}
            />
            {errors.priceBeforeOffer && <p className="text-xs text-destructive mt-0.5">{errors.priceBeforeOffer}</p>}
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
              Price After Discount ($)
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
              disabled
              className="bg-muted border-border cursor-not-allowed opacity-70"
            />
          </div>



          <div className="space-y-1.5">
            <Label htmlFor="offer-value" className="text-foreground text-sm">
              Offer Discount (%)
            </Label>
            <Input
              id="offer-value"
              type="number"
              step="0.01"
              min={0}
              max={100}
              value={offerValue}
              onChange={(e) => setOfferValue(e.target.value)}
              placeholder="e.g. 10"
              className="bg-background border-border"
            />
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
              Region
            </Label>
            <div className="flex gap-2">
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger id="product-region" className="bg-background border-border flex-1">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {regions?.map((r) => (
                    <SelectItem key={r.id} value={r.id.toString()}>
                      <div className="flex items-center gap-2">
                        {r.logo && <img src={getImageUrl(r.logo)} alt="" className="w-5 h-5 object-contain" />}
                        <span>{r.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {region && regions?.find(r => r.id.toString() === region) && (
                <AttributeEditDialog type="regions" item={regions.find(r => r.id.toString() === region)!} onSuccess={setRegion} />
              )}
              <AttributeCreateDialog type="regions" onSuccess={setRegion} />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="product-type" className="text-foreground text-sm">
              Type (Key/Account)
            </Label>
            <div className="flex gap-2">
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="product-type" className="bg-background border-border flex-1">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {types?.map((t) => (
                    <SelectItem key={t.id} value={t.id.toString()}>
                      <div className="flex items-center gap-2">
                        {t.logo && <img src={getImageUrl(t.logo)} alt="" className="w-5 h-5 object-contain" />}
                        <span>{t.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {type && types?.find(t => t.id.toString() === type) && (
                <AttributeEditDialog type="types" item={types.find(t => t.id.toString() === type)!} onSuccess={setType} />
              )}
              <AttributeCreateDialog type="types" onSuccess={setType} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="product-platform" className="text-foreground text-sm">
              Platform
            </Label>
            <div className="flex gap-2">
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger id="product-platform" className="bg-background border-border flex-1">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {platforms?.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      <div className="flex items-center gap-2">
                        {p.logo && <img src={getImageUrl(p.logo)} alt="" className="w-5 h-5 object-contain" />}
                        <span>{p.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {platform && platforms?.find(p => p.id.toString() === platform) && (
                <AttributeEditDialog type="platforms" item={platforms.find(p => p.id.toString() === platform)!} onSuccess={setPlatform} />
              )}
              <AttributeCreateDialog type="platforms" onSuccess={setPlatform} />
            </div>
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
          <Label htmlFor="help-text" className="text-foreground text-sm">
            Help Note (Warning for users)
          </Label>
          <Textarea
            id="help-text"
            value={help}
            onChange={(e) => setHelp(e.target.value)}
            placeholder="e.g. This key can only be activated in Egypt."
            className="bg-background border-border min-h-[80px]"
          />
        </div>
        <div className="space-y-1.5 pb-8">
          <Label htmlFor="description" className="text-foreground text-sm">
            Description
          </Label>
          <div className="bg-background [&_.ql-container]:min-h-[200px] [&_.ql-container]:text-base [&_.ql-editor]:min-h-[200px]">
            {isLoaded ? (
              <ReactQuill
                theme="snow"
                value={description}
                onChange={setDescription}
                placeholder="Full product description…"
              />
            ) : (
              <div className="h-[200px] w-full flex items-center justify-center border border-border rounded-md bg-muted/20 text-muted-foreground text-sm">
                Loading editor…
              </div>
            )}
          </div>
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

