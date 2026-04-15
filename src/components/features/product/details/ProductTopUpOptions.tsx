'use client';

import { cn } from '@/lib/utils';
import type { TopUpPackage } from '@/types/topup';

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
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className={cn(
              'flex flex-col p-4 rounded-xl border transition-all text-left relative overflow-hidden group',
              selectedOptionId === option.id
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border bg-card/60 hover:border-primary/50'
            )}>
            <div className="flex justify-between items-start w-full z-10">
              <span className="font-bold text-sm group-hover:text-primary-hover transition-colors">
                {option.name}
              </span>
              {selectedOptionId === option.id && (
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              )}
            </div>
            <div className="mt-2 z-10">
              <span className="text-lg font-bold">
                {option.currency === 'USD' ? '$' : option.currency}{' '}
                {typeof option.price === 'number'
                  ? option.price.toFixed(2)
                  : parseFloat(String(option.price)).toFixed(2)}
              </span>
            </div>

            {/* Background Decoration */}
            <div
              className={cn(
                'absolute -right-2 -bottom-2 w-12 h-12 bg-primary/5 rounded-full blur-xl transition-all duration-500',
                selectedOptionId === option.id ? 'scale-150 bg-primary/10' : 'group-hover:scale-110'
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
};
