'use client';

import { cn, getImageUrl } from '@/lib/utils';
import type { TopUpPackage } from '@/types/topup';
import Image from 'next/image';

interface ProductTopUpOptionsProps {
  options: TopUpPackage[];
  selectedOptionId: number | null;
  onSelect: (optionId: number) => void;
}

export const ProductTopUpOptions = ({
  options,
  selectedOptionId,
  onSelect,
}: ProductTopUpOptionsProps) => {
  if (!options || options.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {options.map((option) => {
        const hasDiscount = option.price_before_offer && option.price_before_offer > option.price;
        const discountPct = hasDiscount 
          ? Math.round(((option.price_before_offer! - option.price) / option.price_before_offer!) * 100) 
          : 0;

        return (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className={cn(
              'group relative flex flex-col items-center rounded-2xl border-2 transition-all duration-300 text-center overflow-hidden h-full',
              selectedOptionId === option.id
                ? 'border-primary bg-primary/[0.02] shadow-md ring-1 ring-primary transform scale-[1.02]'
                : 'border-border/40 bg-background/50 hover:border-primary/30 hover:bg-background/80 hover:shadow-sm'
            )}>
            
            {/* Discount Badge */}
            {hasDiscount && (
              <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-bl-lg z-20 shadow-md">
                -{discountPct}%
              </div>
            )}

            {/* Selection indicator dot */}
            {selectedOptionId === option.id && (
              <div className="absolute top-3 left-3 w-3 h-3 rounded-full bg-primary shadow-[0_0_12px_rgba(var(--primary),0.8)] z-20" />
            )}

            {/* Package Image - Edge-to-Edge Container */}
            <div className="w-full aspect-[16/9] bg-[#2a1b12] relative overflow-hidden flex items-center justify-center border-b border-border/10">
              {option.image ? (
                <Image
                  src={getImageUrl(option.image)}
                  alt={option.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 768px) 200px, 300px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/5">
                  <span className="text-primary font-bold text-4xl">{option.amount || '💎'}</span>
                </div>
              )}
              {/* Top-to-bottom subtle shadow to anchor the image */}
              <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
            </div>

            {/* Package Info - High Contrast Section */}
            <div className="flex flex-col items-center w-full p-4 pt-4 space-y-2 mt-auto">
              <span className={cn(
                "font-black text-sm sm:text-base leading-tight transition-colors line-clamp-1 flex items-center justify-center px-1",
                selectedOptionId === option.id ? "text-primary" : "text-foreground group-hover:text-primary/90"
              )}>
                {option.name}
              </span>
              
              <div className="flex flex-col items-center">
                {hasDiscount && (
                  <span className="text-sm sm:text-base text-foreground/60 line-through decoration-red-600/80 decoration-2 font-bold mb-0.5">
                    {option.currency === 'USD' ? '$' : option.currency}{' '}
                    {typeof option.price_before_offer === 'number'
                      ? option.price_before_offer.toFixed(2)
                      : parseFloat(String(option.price_before_offer)).toFixed(2)}
                  </span>
                )}
                <span className={cn(
                  "text-xl sm:text-2xl font-black tracking-tighter transition-all",
                  selectedOptionId === option.id ? "text-primary scale-105" : "text-foreground"
                )}>
                  {option.currency === 'USD' ? '$' : option.currency}{' '}
                  {typeof option.price === 'number'
                    ? option.price.toFixed(2)
                    : parseFloat(String(option.price)).toFixed(2)}
                </span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

