import { useEffect, useMemo, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save, X } from 'lucide-react';
import type { ProductCategory } from '@/types/catalog';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils';

interface GameInfoTabProps {
  gameName: string;
  setGameName: (n: string) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  categories: ProductCategory[];
  region: string;
  setRegion: (r: string) => void;
  shortDescription: string;
  setShortDescription: (d: string) => void;
  imageFile: File | null;
  setImageFile: (f: File | null) => void;
  currentLogo: string | null;
  isActive: boolean;
  setIsActive: (a: boolean) => void;
  isAvailable: boolean;
  setIsAvailable: (a: boolean) => void;
  isFeatured: boolean;
  setIsFeatured: (f: boolean) => void;
  gameInfoErrors: Record<string, string>;
  setGameInfoErrors: (e: (prev: Record<string, string>) => Record<string, string>) => void;
  savingGameInfo?: boolean;
  handleSaveGameInfo?: () => void;
  hideSaveButton?: boolean;
}

export function GameInfoTab({
  gameName,
  setGameName,
  selectedCategory,
  setSelectedCategory,
  categories,
  region,
  setRegion,
  shortDescription,
  setShortDescription,
  imageFile,
  setImageFile,
  currentLogo,
  isActive,
  setIsActive,
  isAvailable,
  setIsAvailable,
  isFeatured,
  setIsFeatured,
  gameInfoErrors,
  setGameInfoErrors,
  savingGameInfo,
  handleSaveGameInfo,
  hideSaveButton,
}: GameInfoTabProps) {
  const [imageError, setImageError] = useState<string | null>(null);
  const localPreviewSrc = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : null),
    [imageFile]
  );

  useEffect(() => {
    return () => {
      if (localPreviewSrc) URL.revokeObjectURL(localPreviewSrc);
    };
  }, [localPreviewSrc]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setImageFile(null);
      setImageError('Please select a valid image file.');
      e.target.value = '';
      return;
    }
    setImageError(null);
    setImageFile(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImageError(null);
  };

  const previewSrc = localPreviewSrc ?? (currentLogo ? getImageUrl(currentLogo) : null);

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-foreground text-base">Game Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div className="space-y-1.5">
            <Label htmlFor="category" className="text-foreground text-sm">
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
                id="category"
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
          <div className="space-y-1.5">
            <Label htmlFor="region" className="text-foreground text-sm">
              Region
            </Label>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger id="region" className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="global">Global</SelectItem>
                <SelectItem value="eu">Europe (EU)</SelectItem>
                <SelectItem value="us">United States (US)</SelectItem>
                <SelectItem value="mena">Middle East & Africa (MENA)</SelectItem>
                <SelectItem value="latam">Latin America (LATAM)</SelectItem>
                <SelectItem value="asia">Asia</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="game-image" className="text-foreground text-sm">
              Game Logo / Image (Upload to change)
            </Label>
            <Input
              id="game-image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className={`bg-background cursor-pointer text-sm ${imageError ? 'border-destructive focus-visible:ring-destructive' : 'border-border'}`}
            />
            {imageError && <p className="text-xs text-destructive mt-0.5">{imageError}</p>}
            {previewSrc && (
              <div className="relative w-20 h-20 rounded-md overflow-hidden border border-border group">
                <Image
                  src={previewSrc}
                  alt={gameName || 'topup'}
                  width={80}
                  height={80}
                  className="object-cover w-20 h-20"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white items-center justify-center hidden group-hover:flex">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="short-desc" className="text-foreground text-sm">
              Short Description
            </Label>
            <Input
              id="short-desc"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Brief description…"
              className="bg-background border-border"
            />
          </div>
          <div className="sm:col-span-2 pt-2 mt-2">
            <div className="flex flex-wrap gap-6 pt-2 border-t border-border">
              {[
                { id: 'is-active', label: 'Active', state: isActive, setState: setIsActive },
                {
                  id: 'is-available',
                  label: 'Available for purchase',
                  state: isAvailable,
                  setState: setIsAvailable,
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
                    className="h-4 w-4 accent-primary text-primary border-border rounded focus:ring-primary/20 bg-background"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </div>
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
