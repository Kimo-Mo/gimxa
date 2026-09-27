'use client';

// No local state needed — all state is managed by parent pages
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save } from 'lucide-react';
import type { ProductCategory, Region, Platform, ProductTypeEntity } from '@/types/catalog';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import { AttributeCreateDialog } from '@/components/admin/products/AttributeCreateDialog';
import { AttributeEditDialog } from '@/components/admin/products/AttributeEditDialog';
import { ProductImages } from '@/components/admin/products/ProductImages';
import type { ImageState } from '@/components/admin/products/types';
import { getImageUrl } from '@/lib/utils';

const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => (
    <div className="h-[200px] w-full flex items-center justify-center border border-border rounded-md bg-muted/20">
      Loading Editor...
    </div>
  ),
});

interface GameInfoTabProps {
  gameName: string;
  setGameName: (n: string) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  categories: ProductCategory[];
  region: string;
  setRegion: (r: string) => void;
  regions: Region[];
  type: string;
  setType: (t: string) => void;
  types: ProductTypeEntity[];
  platform: string;
  setPlatform: (p: string) => void;
  platforms: Platform[];
  shortDescription: string;
  setShortDescription: (d: string) => void;
  description?: string;
  setDescription?: (d: string) => void;
  help: string;
  setHelp: (v: string) => void;
  // Images (replaces old single imageFile/currentLogo)
  images: ImageState[];
  handleImageAdd: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setMainImage: (index: number) => void;
  removeImage: (index: number) => void;
  isEditMode?: boolean;
  imageError?: string;
  isActive: boolean;
  setIsActive: (a: boolean) => void;
  isAvailable: boolean;
  setIsAvailable: (a: boolean) => void;
  isFeatured: boolean;
  setIsFeatured: (f: boolean) => void;
  isPopular?: boolean;
  setIsPopular?: (v: boolean) => void;
  gameInfoErrors: Record<string, string>;
  setGameInfoErrors: (e: (prev: Record<string, string>) => Record<string, string>) => void;
  savingGameInfo?: boolean;
  handleSaveGameInfo?: () => void;
  hideSaveButton?: boolean;
  isLoaded?: boolean;
}

export function GameInfoTab({
  gameName,
  setGameName,
  selectedCategory,
  setSelectedCategory,
  categories,
  region,
  setRegion,
  regions,
  type,
  setType,
  types,
  platform,
  setPlatform,
  platforms,
  shortDescription,
  setShortDescription,
  description,
  setDescription,
  help,
  setHelp,
  images,
  handleImageAdd,
  setMainImage,
  removeImage,
  isEditMode = false,
  imageError,
  isActive,
  setIsActive,
  isAvailable,
  setIsAvailable,
  isFeatured,
  setIsFeatured,
  isPopular,
  setIsPopular,
  gameInfoErrors,
  setGameInfoErrors,
  savingGameInfo,
  handleSaveGameInfo,
  hideSaveButton,
  isLoaded = true,
}: GameInfoTabProps) {
  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-foreground text-base">Game Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Game Name */}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="game-name" className="text-foreground text-sm">
              Game Name *
            </Label>
            <Input
              id="game-name"
              value={gameName}
              onChange={(e) => {
                setGameName(e.target.value);
                setGameInfoErrors((prev) => {
                  const n = { ...prev };
                  delete n.name;
                  return n;
                });
              }}
              placeholder="e.g. PUBG Mobile, Mobile Legends…"
              className={`bg-background ${gameInfoErrors.name ? 'border-destructive focus-visible:ring-destructive' : 'border-border'}`}
            />
            {gameInfoErrors.name && (
              <p className="text-xs text-destructive mt-0.5">{gameInfoErrors.name}</p>
            )}
          </div>
          {/* Category */}
          <div className="space-y-1.5">
            <Label htmlFor="topup-category" className="text-foreground text-sm">
              Category *
            </Label>
            <Select
              value={selectedCategory}
              onValueChange={(v) => {
                setSelectedCategory(v);
                setGameInfoErrors((prev) => {
                  const n = { ...prev };
                  delete n.category;
                  return n;
                });
              }}>
              <SelectTrigger
                id="topup-category"
                className={`bg-background ${gameInfoErrors.category ? 'border-destructive focus-visible:ring-destructive' : 'border-border'}`}>
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {gameInfoErrors.category && (
              <p className="text-xs text-destructive mt-0.5">{gameInfoErrors.category}</p>
            )}
          </div>

          {/* Region with create/edit dialogs */}
          <div className="space-y-1.5">
            <Label htmlFor="topup-region" className="text-foreground text-sm">
              Region
            </Label>
            <div className="flex gap-2">
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger id="topup-region" className="bg-background border-border flex-1">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {regions?.map((r) => (
                    <SelectItem key={r.id} value={r.id.toString()}>
                      <div className="flex items-center gap-2">
                        {r.logo && (
                          <img src={getImageUrl(r.logo)} alt="" className="w-5 h-5 object-contain" />
                        )}
                        <span>{r.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {region && regions?.find((r) => r.id.toString() === region) && (
                <AttributeEditDialog
                  type="regions"
                  item={regions.find((r) => r.id.toString() === region)!}
                  onSuccess={setRegion}
                />
              )}
              <AttributeCreateDialog type="regions" onSuccess={setRegion} />
            </div>
          </div>

          {/* Type with create/edit dialogs */}
          <div className="space-y-1.5">
            <Label htmlFor="topup-type" className="text-foreground text-sm">
              Type (Key/Account)
            </Label>
            <div className="flex gap-2">
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="topup-type" className="bg-background border-border flex-1">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {types?.map((t) => (
                    <SelectItem key={t.id} value={t.id.toString()}>
                      <div className="flex items-center gap-2">
                        {t.logo && (
                          <img src={getImageUrl(t.logo)} alt="" className="w-5 h-5 object-contain" />
                        )}
                        <span>{t.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {type && types?.find((t) => t.id.toString() === type) && (
                <AttributeEditDialog
                  type="types"
                  item={types.find((t) => t.id.toString() === type)!}
                  onSuccess={setType}
                />
              )}
              <AttributeCreateDialog type="types" onSuccess={setType} />
            </div>
          </div>

          {/* Platform with create/edit dialogs */}
          <div className="space-y-1.5">
            <Label htmlFor="topup-platform" className="text-foreground text-sm">
              Platform
            </Label>
            <div className="flex gap-2">
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger id="topup-platform" className="bg-background border-border flex-1">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {platforms?.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      <div className="flex items-center gap-2">
                        {p.logo && (
                          <img src={getImageUrl(p.logo)} alt="" className="w-5 h-5 object-contain" />
                        )}
                        <span>{p.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {platform && platforms?.find((p) => p.id.toString() === platform) && (
                <AttributeEditDialog
                  type="platforms"
                  item={platforms.find((p) => p.id.toString() === platform)!}
                  onSuccess={setPlatform}
                />
              )}
              <AttributeCreateDialog type="platforms" onSuccess={setPlatform} />
            </div>
          </div>
        </div>

        {/* Short Description */}
        <div className="space-y-1.5">
          <Label htmlFor="topup-short-desc" className="text-foreground text-sm">
            Short Description
          </Label>
          <Input
            id="topup-short-desc"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder="Brief description…"
            className="bg-background border-border"
            maxLength={500}
          />
        </div>

        {/* Help Note */}
        <div className="space-y-1.5">
          <Label htmlFor="topup-help" className="text-foreground text-sm">
            Help Note (Warning for users)
          </Label>
          <Textarea
            id="topup-help"
            value={help}
            onChange={(e) => setHelp(e.target.value)}
            placeholder="e.g. This top-up is only available for accounts in MENA region."
            className="bg-background border-border min-h-[80px]"
          />
        </div>

        {/* Description (Rich Text) */}
        {setDescription && (
          <div className="space-y-1.5 pb-8">
            <Label htmlFor="topup-long-desc" className="text-foreground text-sm">
              Description
            </Label>
            <div className="bg-background [&_.ql-container]:min-h-[200px] [&_.ql-container]:text-base [&_.ql-editor]:min-h-[200px]">
              {isLoaded ? (
                <ReactQuill
                  theme="snow"
                  value={description || ''}
                  onChange={setDescription}
                  placeholder="Full description of the game / top-up product…"
                />
              ) : (
                <div className="h-[200px] w-full flex items-center justify-center border border-border rounded-md bg-muted/20 text-muted-foreground text-sm">
                  Loading editor…
                </div>
              )}
            </div>
          </div>
        )}

        {/* Checkboxes */}
        <div className="flex flex-wrap gap-6 pt-2 border-t border-border">
          {[
            { id: 'topup-is-active', label: 'Active', state: isActive, setState: setIsActive },
            {
              id: 'topup-is-available',
              label: 'Available for purchase',
              state: isAvailable,
              setState: setIsAvailable,
            },
            ...(setIsPopular
              ? [
                  {
                    id: 'topup-is-popular',
                    label: 'Mark as Popular',
                    state: isPopular ?? false,
                    setState: setIsPopular,
                  },
                ]
              : []),
            {
              id: 'topup-is-featured',
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
                className="h-4 w-4 accent-primary text-primary border-border rounded focus:ring-primary/20 bg-background"
              />
              {label}
            </label>
          ))}
        </div>

        {/* Product Images section */}
        <div className="pt-4 border-t border-border">
          <ProductImages
            images={images}
            handleImageAdd={handleImageAdd}
            setMainImage={setMainImage}
            removeImage={removeImage}
            isEditMode={isEditMode}
            imageError={imageError}
          />
        </div>

        {/* Save button (edit mode) */}
        {!hideSaveButton && handleSaveGameInfo && (
          <div className="flex justify-end pt-2">
            <Button
              type="button"
              onClick={handleSaveGameInfo}
              disabled={savingGameInfo}
              className="bg-primary hover:bg-primary-hover text-primary-foreground gap-2">
              {savingGameInfo ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {savingGameInfo ? 'Saving…' : 'Save Info'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
