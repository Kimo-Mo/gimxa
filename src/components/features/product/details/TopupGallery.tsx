'use client';

import { useState } from 'react';
import { getImageUrl } from '@/lib/utils';
import Image from 'next/image';
import { ZoomIn } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface TopupGalleryProps {
  main_image: { id: number; image: string; is_main: boolean } | undefined;
  name: string;
}

export const TopupGallery = ({ main_image, name }: TopupGalleryProps) => {
  const imageSrc = main_image?.image ? getImageUrl(main_image.image) : null;
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!imageSrc) {
    return (
      <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-muted flex items-center justify-center border border-border">
        <span className="text-muted-foreground text-sm">No image available</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Main Display */}
      <div
        className="relative group aspect-[4/3] w-full rounded-2xl overflow-hidden bg-muted/30 border border-border cursor-zoom-in"
        onClick={() => setLightboxOpen(true)}
      >
        <Image
          src={imageSrc}
          alt={name}
          fill
          className="object-contain transition-all duration-500 group-hover:scale-105"
          priority
          unoptimized
        />

        {/* Zoom hint */}
        <div className="absolute top-3 right-3 bg-black/50 text-white rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm pointer-events-none">
          <ZoomIn className="w-4 h-4" />
        </div>

        {/* Top-Up badge overlay */}
        <div className="absolute top-3 left-3 bg-primary/90 text-primary-foreground text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md backdrop-blur-sm">
          Top-Up
        </div>
      </div>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-3xl bg-black/95 border-none shadow-none p-4 flex flex-col items-center justify-center">
          <DialogTitle className="sr-only">Image — {name}</DialogTitle>
          <DialogDescription className="sr-only">Full-size image viewer</DialogDescription>
          <div className="relative w-full aspect-[4/3] flex items-center justify-center">
            <Image
              src={imageSrc}
              alt={name}
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
